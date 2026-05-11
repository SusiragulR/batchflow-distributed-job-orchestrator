import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type RedisClientType } from "redis";

import { env } from "../config/env.js";

let client: RedisClientType | null = null;
let scriptsLoaded = false;
let promoteRetriesScript = "";
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const getClient = () => {
  if (!env.redisUrl) {
    throw new Error("REDIS_URL is required");
  }

  if (!client) {
    const parsed = new URL(env.redisUrl);
    const useTls =
      parsed.protocol === "rediss:" || parsed.hostname.includes("upstash.io");

    client = createClient({
      url: env.redisUrl,
      socket: {
        tls: useTls,
      },
    });
  }

  return client;
};

export const getRedis = async () => {
  const redis = getClient();
  if (!redis.isOpen) {
    await redis.connect();
  }
  if (!scriptsLoaded) {
    const promotePath = path.resolve(
      moduleDir,
      "../../src/queue/scripts/promote-retries.lua",
    );
    promoteRetriesScript = await readFile(promotePath, "utf8");
    scriptsLoaded = true;
  }
  return redis;
};

export const promoteRetries = async (now: number, limit: number) => {
  const redis = await getRedis();
  const result = await redis.eval(promoteRetriesScript, {
    keys: [env.retryQueueName, env.queueName],
    arguments: [String(now), String(limit)],
  });
  return Array.isArray(result) ? result.length : 0;
};
