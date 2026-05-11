import path from "node:path";

import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: false,
});

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  port: toNumber(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  workerConcurrency: toNumber(process.env.WORKER_CONCURRENCY, 2),
  failureRate: toNumber(process.env.FAILURE_RATE, 0.4),
  retryBaseDelayMs: toNumber(process.env.RETRY_BASE_DELAY_MS, 2000),
  queueName: process.env.QUEUE_NAME ?? "batchflow:jobs:ready",
  retryQueueName: process.env.RETRY_QUEUE_NAME ?? "batchflow:jobs:retry",
} as const;
