import { Router } from "express";

import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "batchflow-backend",
    workerEmbeddedInApi: env.runWorkerInApi,
    timestamp: new Date().toISOString(),
  });
});
