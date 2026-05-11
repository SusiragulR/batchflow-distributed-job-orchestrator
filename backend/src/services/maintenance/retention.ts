import { BATCH_RETENTION_DAYS } from "../../config/constants.js";
import { query } from "../../db/client.js";
import { logger } from "../../lib/logger.js";

type RetentionRunResult = {
  deletedBatches: number;
  durationMs: number;
};

const deleteExpiredBatches = async () => {
  const result = await query(
    `
      DELETE FROM batches
      WHERE created_at < NOW() - ($1::text || ' days')::interval
    `,
    [String(BATCH_RETENTION_DAYS)],
  );

  return result.rowCount ?? 0;
};

export class RetentionService {
  #isRunning = false;

  async runBatchCleanup(): Promise<RetentionRunResult | null> {
    if (this.#isRunning) {
      logger.warn("Skipping retention cleanup because a previous run is still active");
      return null;
    }

    this.#isRunning = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    try {
      logger.info("Retention cleanup started", {
        retentionDays: BATCH_RETENTION_DAYS,
        startedAt: startedAtIso,
      });

      const deletedBatches = await deleteExpiredBatches();
      const durationMs = Date.now() - startedAt;

      logger.info("Retention cleanup completed", {
        retentionDays: BATCH_RETENTION_DAYS,
        deletedBatches,
        durationMs,
        startedAt: startedAtIso,
        finishedAt: new Date().toISOString(),
      });

      return {
        deletedBatches,
        durationMs,
      };
    } catch (error) {
      logger.error("Retention cleanup failed", {
        retentionDays: BATCH_RETENTION_DAYS,
        durationMs: Date.now() - startedAt,
        startedAt: startedAtIso,
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    } finally {
      this.#isRunning = false;
    }
  }
}
