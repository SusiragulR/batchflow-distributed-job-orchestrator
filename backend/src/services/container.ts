import { BatchService } from "./batches/service.js";
import {
  PostgresBatchRepository,
  PostgresRedisWorkerRuntime,
  RedisQueueProducer,
} from "./batches/postgres-store.js";
import { RetentionService } from "./maintenance/retention.js";

const batchRepository = new PostgresBatchRepository();
const queueProducer = new RedisQueueProducer();

export const services = {
  batches: new BatchService(batchRepository, queueProducer),
  workerRuntime: new PostgresRedisWorkerRuntime(),
  retention: new RetentionService(),
};
