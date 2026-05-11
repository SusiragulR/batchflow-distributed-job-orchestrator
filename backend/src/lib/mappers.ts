import type {
  BatchRecord,
  JobRecord,
  LogRecord,
} from "@batchflow/shared";

type BatchRow = {
  id: string;
  client_id: string;
  name: string;
  total_jobs: number;
  status: BatchRecord["status"];
  created_at: Date;
  completed_at: Date | null;
};

type JobRow = {
  id: string;
  batch_id: string;
  status: JobRecord["status"];
  retry_count: number;
  max_retries: number;
  created_at: Date;
  updated_at: Date;
};

type LogRow = {
  id: string;
  job_id: string;
  batch_id: string;
  message: string;
  level: LogRecord["level"];
  event_type: LogRecord["eventType"];
  created_at: Date;
};

export const mapBatchRow = (row: BatchRow): BatchRecord => ({
  id: row.id,
  clientId: row.client_id,
  name: row.name,
  totalJobs: row.total_jobs,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  completedAt: row.completed_at ? row.completed_at.toISOString() : null,
});

export const mapJobRow = (row: JobRow): JobRecord => ({
  id: row.id,
  batchId: row.batch_id,
  status: row.status,
  retryCount: row.retry_count,
  maxRetries: row.max_retries,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapLogRow = (row: LogRow): LogRecord => ({
  id: row.id,
  jobId: row.job_id,
  batchId: row.batch_id,
  message: row.message,
  level: row.level,
  eventType: row.event_type,
  createdAt: row.created_at.toISOString(),
});
