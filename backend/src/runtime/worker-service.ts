import {
  DEFAULT_WORKER_TRIGGER_BURST_LIMIT,
  MAX_JOB_DELAY_MS,
  MIN_JOB_DELAY_MS,
  RETENTION_CLEANUP_INTERVAL_MS,
  RETRY_SCHEDULER_INTERVAL_MS,
} from "../config/constants.js";
import { env } from "../config/env.js";
import { initDb } from "../db/client.js";
import { logger } from "../lib/logger.js";
import { getRedis } from "../queue/redis.js";
import { services } from "../services/container.js";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const randomDelay = () =>
  Math.floor(Math.random() * (MAX_JOB_DELAY_MS - MIN_JOB_DELAY_MS + 1)) +
  MIN_JOB_DELAY_MS;

type WorkerBootstrapOptions = {
  source: "dedicated-worker" | "embedded-api";
};

class WorkerServiceRuntime {
  #started = false;
  #triggerInFlight = false;

  private startRetentionScheduler() {
    const runCleanup = async () => {
      await services.retention.runBatchCleanup();
    };

    void runCleanup();
    setInterval(() => {
      void runCleanup();
    }, RETENTION_CLEANUP_INTERVAL_MS);

    logger.info("Retention scheduler started", {
      intervalMs: RETENTION_CLEANUP_INTERVAL_MS,
    });
  }

  private async processOneCycle(workerId: number, source: string) {
    await services.workerRuntime.promoteRetries();
    const job = await services.workerRuntime.claimNextJob();

    if (!job) {
      return false;
    }

    logger.info("Worker picked job", {
      workerId,
      source,
      jobId: job.jobId,
      batchId: job.batchId,
      retryCount: job.retryCount,
    });

    await sleep(randomDelay());

    if (Math.random() < env.failureRate) {
      await services.workerRuntime.failJob(job.jobId);
    } else {
      await services.workerRuntime.finishJob(job.jobId);
    }

    return true;
  }

  private async startWorkerLoop(workerId: number, source: WorkerBootstrapOptions["source"]) {
    logger.info("Worker loop started", { workerId, source });

    while (true) {
      try {
        const processed = await this.processOneCycle(workerId, source);

        if (!processed) {
          await sleep(RETRY_SCHEDULER_INTERVAL_MS);
        }
      } catch (error) {
        logger.error("Worker loop error", {
          workerId,
          source,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  async bootstrap(options: WorkerBootstrapOptions) {
    if (this.#started) {
      logger.warn("Worker service bootstrap skipped because it is already running", options);
      return;
    }

    this.#started = true;

    await initDb();
    await getRedis();

    logger.info("Worker service bootstrapping", {
      concurrency: env.workerConcurrency,
      source: options.source,
    });

    this.startRetentionScheduler();

    Array.from({ length: env.workerConcurrency }, (_, index) => {
      void this.startWorkerLoop(index + 1, options.source);
    });
  }

  async triggerBurst(source: string, limit = env.workerTriggerBurstLimit || DEFAULT_WORKER_TRIGGER_BURST_LIMIT) {
    if (this.#triggerInFlight) {
      return {
        accepted: false,
        reason: "trigger-already-running",
      };
    }

    this.#triggerInFlight = true;

    try {
      let processedJobs = 0;

      for (let index = 0; index < limit; index += 1) {
        const processed = await this.processOneCycle(0, source);
        if (!processed) {
          break;
        }
        processedJobs += 1;
      }

      logger.info("Worker trigger burst completed", {
        source,
        limit,
        processedJobs,
      });

      return {
        accepted: true,
        processedJobs,
      };
    } catch (error) {
      logger.error("Worker trigger burst failed", {
        source,
        limit,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        accepted: false,
        reason: "trigger-failed",
      };
    } finally {
      this.#triggerInFlight = false;
    }
  }
}

export const workerServiceRuntime = new WorkerServiceRuntime();
