import type {
  BatchRecord,
  BatchStats,
  JobRecord,
  LogRecord,
  QueueJobPayload,
} from "@batchflow/shared";

export type CreateBatchInput = {
  clientId: string;
  name: string;
  totalJobs: number;
  maxRetries: number;
};

export type BatchListResult = {
  items: BatchRecord[];
};

export interface BatchRepository {
  listByClientId(clientId: string): Promise<BatchRecord[]>;
  getById(batchId: string, clientId: string): Promise<BatchRecord | null>;
  createBatchWithJobs(input: CreateBatchInput): Promise<{
    batch: BatchRecord;
    jobs: JobRecord[];
  }>;
  getJobs(batchId: string, clientId: string): Promise<JobRecord[] | null>;
  getStats(batchId: string, clientId: string): Promise<BatchStats | null>;
  getLogs(
    batchId: string,
    clientId: string,
    page: number,
    limit: number,
  ): Promise<
    | {
        items: LogRecord[];
        hasMore: boolean;
      }
    | null
  >;
  getThroughput(
    batchId: string,
    clientId: string,
  ): Promise<Array<{ label: string; completed: number }> | null>;
  getStatusSeries(
    batchId: string,
    clientId: string,
  ): Promise<
    Array<{
      label: string;
      success: number;
      failed: number;
      processing: number;
    }> | null
  >;
  getRetryDistribution(
    batchId: string,
    clientId: string,
  ): Promise<Array<{ retryCount: number; jobs: number }> | null>;
}

export interface QueueProducer {
  enqueueMany(payloads: QueueJobPayload[]): Promise<void>;
}
