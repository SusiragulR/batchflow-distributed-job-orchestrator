import { createServer } from "node:http";

import { WebSocketServer } from "ws";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initDb } from "./db/client.js";
import { logger } from "./lib/logger.js";
import { getRedis } from "./queue/redis.js";
import { workerServiceRuntime } from "./runtime/worker-service.js";

const app = createApp();
const server = createServer(app);
const wsServer = new WebSocketServer({ server });

wsServer.on("connection", (socket) => {
  logger.info("WebSocket client connected");

  socket.on("message", (message) => {
    logger.info("WebSocket message received", {
      payload: message.toString(),
    });
  });

  socket.on("close", () => {
    logger.info("WebSocket client disconnected");
  });
});

const bootstrap = async () => {
  await initDb();
  await getRedis();

  if (env.runWorkerInApi) {
    await workerServiceRuntime.bootstrap({
      source: "embedded-api",
    });
  }

  server.listen(env.port, () => {
    logger.info("API server started", {
      port: env.port,
      workerEmbeddedInApi: env.runWorkerInApi,
    });
  });
};

void bootstrap();
