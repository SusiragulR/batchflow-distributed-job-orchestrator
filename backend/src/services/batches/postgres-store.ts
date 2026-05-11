import { randomUUID } from "node:crypto";

import {
  BATCH_STATUS,
  JOB_STATUS,
  LOG_EVENT_TYPE,
  LOG_LEVEL,
  type BatchStats,
  type QueueJobPayload,
} from "@batchflow/shared";
import type { PoolClient } from "pg";

import { env } from "../../config/env.js";
import { query, withTransaction } from "../../db/client.js";
import { mapBatchRow, mapJobRow, mapLogRow } from "../../lib/mappers.js";
import { parseQueuePayload, serializeQueuePayload } from "../../queue/payload.js";
import { getRedis, promoteRetries as promoteRetriesInRedis } from "../../queue/redis.js";
import { calculateRetryAt } from "../../queue/retry.js";
import type {
  BatchRepository,
  CreateBatchInput,
  QueueProducer,
} from "./contracts.js";

const createLogRecord = (
  jobId: string,
  batchId: string,
  message: string,
  eventType: "STARTED" | "SUCCESS" | "FAILURE" | "RETRY",
  level: "INFO" | "WARN" | "ERROR",
) => ({
  id: randomUUID(),
  jobId,
  batchId,
  message,
  eventType,
  level,
});

const markBatchCompletedIfNeeded = async (
  client: PoolClient,
  batchId: string,
) => {
  const result = await client.query<{
    total_jobs: number;
    completed_count: number;
  }>(
    `
      SELECT
        b.total_jobs,
        COUNT(*) FILTER (WHERE j.status IN ('SUCCESS', 'FAILED'))::int AS completed_count
      FROM batches b
      LEFT JOIN jobs j ON j.batch_id = b.id
      WHERE b.id = $1
      GROUP BY b.id, b.total_jobs
    `,
    [batchId],
  );

  const row = result.rows[0];
  if (!row || row.completed_count !== row.total_jobs) {
    return;
  }

  await client.query(
    `
      UPDATE batches
      SET status = 'COMPLETED', completed_at = NOW()
      WHERE id = $1 AND status <> 'COMPLETED'
    `,
    [batchId],
  );
};

export class PostgresBatchRepository implements BatchRepository {
  async listByClientId(clientId: string) {
    const result = await query<{
      id: string;
      client_id: string;
      name: string;
      total_jobs: number;
      status: "RUNNING" | "COMPLETED";
      created_at: Date;
      completed_at: Date | null;
    }>(
      `
        SELECT id, client_id, name, total_jobs, status, created_at, completed_at
        FROM batches
        WHERE client_id = $1
        ORDER BY created_at DESC
      `,
      [clientId],
    );

    return result.rows.map(mapBatchRow);
  }

  async getById(batchId: string, clientId: string) {
    const result = await query<{
      id: string;
      client_id: string;
      name: string;
      total_jobs: number;
      status: "RUNNING" | "COMPLETED";
      created_at: Date;
      completed_at: Date | null;
    }>(
      `
        SELECT id, client_id, name, total_jobs, status, created_at, completed_at
        FROM batches
        WHERE id = $1 AND client_id = $2
      `,
      [batchId, clientId],
    );

    return result.rows[0] ? mapBatchRow(result.rows[0]) : null;
  }

  async createBatchWithJobs(input: CreateBatchInput) {
    return withTransaction(async (client) => {
      const batchId = randomUUID();
      const batchInsert = await client.query<{
        id: string;
        client_id: string;
        name: string;
        total_jobs: number;
        status: "RUNNING" | "COMPLETED";
        created_at: Date;
        completed_at: Date | null;
      }>(
        `
          INSERT INTO batches (id, client_id, name, total_jobs, status)
          VALUES ($1, $2, $3, $4, 'RUNNING')
          RETURNING id, client_id, name, total_jobs, status, created_at, completed_at
        `,
        [batchId, input.clientId, input.name, input.totalJobs],
      );

      const jobs = [];
      for (let index = 0; index < input.totalJobs; index += 1) {
        const jobId = randomUUID();
        const jobInsert = await client.query<{
          id: string;
          batch_id: string;
          status: "QUEUED" | "PROCESSING" | "SUCCESS" | "FAILED";
          retry_count: number;
          max_retries: number;
          created_at: Date;
          updated_at: Date;
        }>(
          `
            INSERT INTO jobs (id, batch_id, status, retry_count, max_retries)
            VALUES ($1, $2, 'QUEUED', 0, $3)
            RETURNING id, batch_id, status, retry_count, max_retries, created_at, updated_at
          `,
          [jobId, batchId, input.maxRetries],
        );
        jobs.push(mapJobRow(jobInsert.rows[0]));
      }

      return {
        batch: mapBatchRow(batchInsert.rows[0]),
        jobs,
      };
    });
  }

  async getJobs(batchId: string, clientId: string) {
    const owner = await this.getById(batchId, clientId);
    if (!owner) {
      return null;
    }

    const result = await query<{
      id: string;
      batch_id: string;
      status: "QUEUED" | "PROCESSING" | "SUCCESS" | "FAILED";
      retry_count: number;
      max_retries: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT id, batch_id, status, retry_count, max_retries, created_at, updated_at
        FROM jobs
        WHERE batch_id = $1
        ORDER BY created_at ASC
      `,
      [batchId],
    );

    return result.rows.map(mapJobRow);
  }

  async getStats(batchId: string, clientId: string): Promise<BatchStats | null> {
    const owner = await this.getById(batchId, clientId);
    if (!owner) {
      return null;
    }

    const result = await query<{
      total_jobs: number;
      success: number;
      failed: number;
      processing: number;
    }>(
      `
        SELECT
          b.total_jobs,
          COUNT(*) FILTER (WHERE j.status = 'SUCCESS')::int AS success,
          COUNT(*) FILTER (WHERE j.status = 'FAILED')::int AS failed,
          COUNT(*) FILTER (WHERE j.status IN ('QUEUED', 'PROCESSING'))::int AS processing
        FROM batches b
        LEFT JOIN jobs j ON j.batch_id = b.id
        WHERE b.id = $1
        GROUP BY b.id, b.total_jobs
      `,
      [batchId],
    );

    const row = result.rows[0];
    return row
      ? {
          total: row.total_jobs,
          success: row.success,
          failed: row.failed,
          processing: row.processing,
        }
      : null;
  }

  async getLogs(batchId: string, clientId: string, page: number, limit: number) {
    const owner = await this.getById(batchId, clientId);
    if (!owner) {
      return null;
    }

    const offset = (page - 1) * limit;
    const rows = await query<{
      id: string;
      job_id: string;
      batch_id: string;
      message: string;
      level: "INFO" | "WARN" | "ERROR";
      event_type: "STARTED" | "SUCCESS" | "FAILURE" | "RETRY";
      created_at: Date;
    }>(
      `
        SELECT
          l.id,
          l.job_id,
          j.batch_id,
          l.message,
          l.level,
          l.event_type,
          l.created_at
        FROM logs l
        JOIN jobs j ON j.id = l.job_id
        WHERE j.batch_id = $1
        ORDER BY l.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [batchId, limit, offset],
    );

    const count = await query<{ total: number }>(
      `
        SELECT COUNT(*)::int AS total
        FROM logs l
        JOIN jobs j ON j.id = l.job_id
        WHERE j.batch_id = $1
      `,
      [batchId],
    );

    return {
      items: rows.rows.map(mapLogRow),
      hasMore: offset + limit < (count.rows[0]?.total ?? 0),
    };
  }

  async getThroughput(batchId: string, clientId: string) {
    const owner = await this.getById(batchId, clientId);
    if (!owner) {
      return null;
    }

    const result = await query<{ bucket: Date; completed: number }>(
      `
        SELECT
          DATE_TRUNC('minute', l.created_at) AS bucket,
          COUNT(*)::int AS completed
        FROM logs l
        JOIN jobs j ON j.id = l.job_id
        WHERE j.batch_id = $1
          AND l.event_type IN ('SUCCESS', 'FAILURE')
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      [batchId],
    );

    return result.rows.map((row: { bucket: Date; completed: number }) => ({
      label: row.bucket.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: row.completed,
    }));
  }

  async getStatusSeries(batchId: string, clientId: string) {
    const owner = await this.getById(batchId, clientId);
    if (!owner) {
      return null;
    }

    const result = await query<{
      bucket: Date;
      success: number;
      failed: number;
      processing: number;
    }>(
      `
        SELECT
          DATE_TRUNC('minute', l.created_at) AS bucket,
          COUNT(*) FILTER (WHERE l.event_type = 'SUCCESS')::int AS success,
          COUNT(*) FILTER (WHERE l.event_type = 'FAILURE')::int AS failed,
          COUNT(*) FILTER (WHERE l.event_type = 'STARTED')::int AS processing
        FROM logs l
        JOIN jobs j ON j.id = l.job_id
        WHERE j.batch_id = $1
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      [batchId],
    );

    return result.rows.map((row: {
      bucket: Date;
      success: number;
      failed: number;
      processing: number;
    }) => ({
      label: row.bucket.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      success: row.success,
      failed: row.failed,
      processing: row.processing,
    }));
  }

  async getRetryDistribution(batchId: string, clientId: string) {
    const owner = await this.getById(batchId, clientId);
    if (!owner) {
      return null;
    }

    const result = await query<{ retry_count: number; jobs: number }>(
      `
        SELECT retry_count, COUNT(*)::int AS jobs
        FROM jobs
        WHERE batch_id = $1
        GROUP BY retry_count
        ORDER BY retry_count ASC
      `,
      [batchId],
    );

    return result.rows.map((row: { retry_count: number; jobs: number }) => ({
      retryCount: row.retry_count,
      jobs: row.jobs,
    }));
  }
}

export class RedisQueueProducer implements QueueProducer {
  async enqueueMany(payloads: QueueJobPayload[]) {
    if (!payloads.length) {
      return;
    }

    const redis = await getRedis();
    const serialized = payloads.map(serializeQueuePayload);
    await redis.lPush(env.queueName, serialized);
  }
}

export class PostgresRedisWorkerRuntime {
  async promoteRetries(now = Date.now()) {
    return promoteRetriesInRedis(now, 100);
  }

  async claimNextJob() {
    const redis = await getRedis();
    const popped = await redis.brPop(env.queueName, 1);
    if (!popped?.element) {
      return null;
    }

    const payload = parseQueuePayload(popped.element);

    await withTransaction(async (client) => {
      const jobResult = await client.query<{
        id: string;
        batch_id: string;
      }>(
        `
          UPDATE jobs
          SET status = 'PROCESSING', updated_at = NOW()
          WHERE id = $1
          RETURNING id, batch_id
        `,
        [payload.jobId],
      );

      const job = jobResult.rows[0];
      if (!job) {
        return;
      }

      const log = createLogRecord(
        job.id,
        job.batch_id,
        `Job ${job.id.slice(0, 8)} is being processed`,
        LOG_EVENT_TYPE.STARTED,
        LOG_LEVEL.INFO,
      );

      await client.query(
        `
          INSERT INTO logs (id, job_id, message, level, event_type, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [log.id, log.jobId, log.message, log.level, log.eventType],
      );
    });

    return payload;
  }

  async finishJob(jobId: string) {
    await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        batch_id: string;
      }>(
        `
          UPDATE jobs
          SET status = 'SUCCESS', updated_at = NOW()
          WHERE id = $1
          RETURNING id, batch_id
        `,
        [jobId],
      );

      const job = result.rows[0];
      if (!job) {
        return;
      }

      const log = createLogRecord(
        job.id,
        job.batch_id,
        `Job ${job.id.slice(0, 8)} processed successfully`,
        LOG_EVENT_TYPE.SUCCESS,
        LOG_LEVEL.INFO,
      );

      await client.query(
        `
          INSERT INTO logs (id, job_id, message, level, event_type, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [log.id, log.jobId, log.message, log.level, log.eventType],
      );

      await markBatchCompletedIfNeeded(client, job.batch_id);
    });
  }

  async failJob(jobId: string) {
    const redis = await getRedis();

    await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        batch_id: string;
        retry_count: number;
        max_retries: number;
      }>(
        `
          UPDATE jobs
          SET retry_count = retry_count + 1, updated_at = NOW()
          WHERE id = $1
          RETURNING id, batch_id, retry_count, max_retries
        `,
        [jobId],
      );

      const job = result.rows[0];
      if (!job) {
        return;
      }

      if (job.retry_count <= job.max_retries) {
        await client.query(
          `
            UPDATE jobs
            SET status = 'QUEUED', updated_at = NOW()
            WHERE id = $1
          `,
          [job.id],
        );

        const retryPayload = serializeQueuePayload({
          jobId: job.id,
          batchId: job.batch_id,
          retryCount: job.retry_count,
        });
        const retryAt = calculateRetryAt(
          env.retryBaseDelayMs,
          job.retry_count - 1,
        );
        await redis.zAdd(env.retryQueueName, [
          { score: retryAt, value: retryPayload },
        ]);

        const log = createLogRecord(
          job.id,
          job.batch_id,
          `Job ${job.id.slice(0, 8)} failed and was rescheduled for retry ${job.retry_count}`,
          LOG_EVENT_TYPE.RETRY,
          LOG_LEVEL.WARN,
        );
        await client.query(
          `
            INSERT INTO logs (id, job_id, message, level, event_type, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `,
          [log.id, log.jobId, log.message, log.level, log.eventType],
        );
        return;
      }

      await client.query(
        `
          UPDATE jobs
          SET status = 'FAILED', updated_at = NOW()
          WHERE id = $1
        `,
        [job.id],
      );

      const log = createLogRecord(
        job.id,
        job.batch_id,
        `Job ${job.id.slice(0, 8)} failed after max retries`,
        LOG_EVENT_TYPE.FAILURE,
        LOG_LEVEL.ERROR,
      );
      await client.query(
        `
          INSERT INTO logs (id, job_id, message, level, event_type, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [log.id, log.jobId, log.message, log.level, log.eventType],
      );

      await markBatchCompletedIfNeeded(client, job.batch_id);
    });
  }
}
