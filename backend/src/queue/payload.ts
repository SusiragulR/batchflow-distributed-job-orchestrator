import { z } from "zod";

export const queueJobPayloadSchema = z.object({
  jobId: z.string().uuid(),
  batchId: z.string().uuid(),
  retryCount: z.number().int().min(0),
});

export type QueueJobPayloadInput = z.infer<typeof queueJobPayloadSchema>;

export const serializeQueuePayload = (payload: QueueJobPayloadInput) =>
  JSON.stringify(payload);

export const parseQueuePayload = (payload: string) =>
  queueJobPayloadSchema.parse(JSON.parse(payload));

