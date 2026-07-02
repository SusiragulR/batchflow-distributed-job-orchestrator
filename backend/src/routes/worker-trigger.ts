import { Router } from "express";

import { env } from "../config/env.js";
import { HttpError } from "../lib/errors.js";
import { workerServiceRuntime } from "../runtime/worker-service.js";

const HEADER_NAME = "x-worker-trigger-secret";

const assertAuthorized = (providedSecret: string | undefined) => {
  if (!env.workerTriggerSecret) {
    throw new HttpError(503, "Worker trigger is not configured");
  }

  if (!providedSecret || providedSecret !== env.workerTriggerSecret) {
    throw new HttpError(401, "Invalid worker trigger secret");
  }
};

export const workerTriggerRouter = Router();

workerTriggerRouter.get("/", async (req, res, next) => {
  try {
    const secret = req.header(HEADER_NAME) ?? String(req.query.key ?? "");
    assertAuthorized(secret);

    const result = await workerServiceRuntime.triggerBurst("http-trigger");

    return res.json({
      status: result.accepted ? "accepted" : "skipped",
      ...result,
      workerEmbeddedInApi: env.runWorkerInApi,
    });
  } catch (error) {
    return next(error);
  }
});
