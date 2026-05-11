import { Router } from "express";
import { z } from "zod";

import { HttpError } from "../lib/errors.js";
import { services } from "../services/container.js";

const createBatchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  totalJobs: z.number().int().min(1).max(500),
  maxRetries: z.number().int().min(0).max(5),
});

export const batchesRouter = Router();

batchesRouter.get("/", async (req, res, next) => {
  try {
    const result = await services.batches.list(req.clientId!);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId", async (req, res, next) => {
  try {
    const result = await services.batches.get(req.params.batchId, req.clientId!);
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId/jobs", async (req, res, next) => {
  try {
    const result = await services.batches.getJobs(req.params.batchId, req.clientId!);
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId/stats", async (req, res, next) => {
  try {
    const result = await services.batches.getStats(req.params.batchId, req.clientId!);
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId/logs", async (req, res, next) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);

  try {
    const result = await services.batches.getLogs(
      req.params.batchId,
      req.clientId!,
      Number.isNaN(page) ? 1 : page,
      Number.isNaN(limit) ? 50 : Math.min(limit, 100),
    );
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId/throughput", async (req, res, next) => {
  try {
    const result = await services.batches.getThroughput(req.params.batchId, req.clientId!);
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId/status-series", async (req, res, next) => {
  try {
    const result = await services.batches.getStatusSeries(req.params.batchId, req.clientId!);
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.get("/:batchId/retries", async (req, res, next) => {
  try {
    const result = await services.batches.getRetryDistribution(req.params.batchId, req.clientId!);
    if (!result) {
      return next(new HttpError(404, "Batch not found"));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

batchesRouter.post("/", async (req, res, next) => {
  const parsed = createBatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(parsed.error);
  }

  if (!req.clientId) {
    return next(new HttpError(400, "Missing client id"));
  }

  try {
    const result = await services.batches.create({
      clientId: req.clientId,
      ...parsed.data,
    });

    return res.status(202).json(result);
  } catch (error) {
    return next(error);
  }
});
