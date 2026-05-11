import {
  MAX_JOB_DELAY_MS,
  MIN_JOB_DELAY_MS,
  RETENTION_CLEANUP_INTERVAL_MS,
  RETRY_SCHEDULER_INTERVAL_MS,
} from "./config/constants.js";
import { env } from "./config/env.js";
import { initDb } from "./db/client.js";
import { logger } from "./lib/logger.js";
import { getRedis } from "./queue/redis.js";
import { services } from "./services/container.js";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const randomDelay = () =>
  Math.floor(Math.random() * (MAX_JOB_DELAY_MS - MIN_JOB_DELAY_MS + 1)) +
  MIN_JOB_DELAY_MS;

const startWorkerLoop = async (workerId: number) => {
  logger.info("Worker loop started", { workerId });

  while (true) {
    try {
      await services.workerRuntime.promoteRetries();
      const job = await services.workerRuntime.claimNextJob();

      if (!job) {
        await sleep(RETRY_SCHEDULER_INTERVAL_MS);
        continue;
      }

      await sleep(randomDelay());

      if (Math.random() < env.failureRate) {
        await services.workerRuntime.failJob(job.jobId);
      } else {
        await services.workerRuntime.finishJob(job.jobId);
      }
    } catch (error) {
      logger.error("Worker loop error", {
        workerId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

const startRetentionScheduler = () => {
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
};

const bootstrap = async () => {
  await initDb();
  await getRedis();

  logger.info("Worker service bootstrapping", {
    concurrency: env.workerConcurrency,
  });

  startRetentionScheduler();

  await Promise.all(
    Array.from({ length: env.workerConcurrency }, (_, index) =>
      startWorkerLoop(index + 1),
    ),
  );
};

void bootstrap();
