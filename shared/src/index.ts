export const BATCH_STATUS = {
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
} as const;

export const JOB_STATUS = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export const LOG_LEVEL = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

export const LOG_EVENT_TYPE = {
  STARTED: "STARTED",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  RETRY: "RETRY",
} as const;

export type BatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];
export type LogEventType =
  (typeof LOG_EVENT_TYPE)[keyof typeof LOG_EVENT_TYPE];

export type BatchRecord = {
  id: string;
  clientId: string;
  name: string;
  totalJobs: number;
  status: BatchStatus;
  createdAt: string;
  completedAt: string | null;
};

export type JobRecord = {
  id: string;
  batchId: string;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
};

export type LogRecord = {
  id: string;
  jobId: string;
  batchId: string;
  message: string;
  level: LogLevel;
  eventType: LogEventType;
  createdAt: string;
};

export type BatchStats = {
  total: number;
  success: number;
  failed: number;
  processing: number;
};

export type QueueJobPayload = {
  jobId: string;
  batchId: string;
  retryCount: number;
};

export type LogStreamEvent = {
  batchId: string;
  jobId: string;
  message: string;
  level: LogLevel;
  eventType: LogEventType;
  timestamp: string;
};

