import type { QueueJobPayload } from "@batchflow/shared";

import type { BatchRepository, CreateBatchInput, QueueProducer } from "./contracts.js";

export class BatchService {
  constructor(
    private readonly repository: BatchRepository,
    private readonly queueProducer: QueueProducer,
  ) {}

  async list(clientId: string) {
    const items = await this.repository.listByClientId(clientId);
    return { items };
  }

  async get(batchId: string, clientId: string) {
    const batch = await this.repository.getById(batchId, clientId);
    return batch ? { batch } : null;
  }

  async create(input: CreateBatchInput) {
    const { batch, jobs } = await this.repository.createBatchWithJobs(input);

    const payloads: QueueJobPayload[] = jobs.map((job) => ({
      jobId: job.id,
      batchId: job.batchId,
      retryCount: 0,
    }));

    await this.queueProducer.enqueueMany(payloads);

    return { batch };
  }

  async getJobs(batchId: string, clientId: string) {
    const items = await this.repository.getJobs(batchId, clientId);
    return items ? { items } : null;
  }

  async getStats(batchId: string, clientId: string) {
    const stats = await this.repository.getStats(batchId, clientId);
    return stats;
  }

  async getLogs(batchId: string, clientId: string, page: number, limit: number) {
    const result = await this.repository.getLogs(batchId, clientId, page, limit);
    return result
      ? { items: result.items, page, limit, hasMore: result.hasMore }
      : null;
  }

  async getThroughput(batchId: string, clientId: string) {
    const items = await this.repository.getThroughput(batchId, clientId);
    return items ? { items } : null;
  }

  async getStatusSeries(batchId: string, clientId: string) {
    const items = await this.repository.getStatusSeries(batchId, clientId);
    return items ? { items } : null;
  }

  async getRetryDistribution(batchId: string, clientId: string) {
    const items = await this.repository.getRetryDistribution(batchId, clientId);
    return items ? { items } : null;
  }
}
