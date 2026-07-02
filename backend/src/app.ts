import compression from "compression";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";

import { env } from "./config/env.js";
import { HttpError } from "./lib/errors.js";
import { healthRouter } from "./routes/health.js";
import { apiRouter } from "./routes/index.js";
import { workerTriggerRouter } from "./routes/worker-trigger.js";
import { clientIdMiddleware } from "./middleware/client-id.js";

export const createApp = () => {
  const app = express();

  app.use(compression());

  app.use(
    cors({
      origin: env.frontendOrigin,
    }),
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/worker-trigger", workerTriggerRouter);
  app.use("/api", clientIdMiddleware, apiRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.flatten(),
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
};
