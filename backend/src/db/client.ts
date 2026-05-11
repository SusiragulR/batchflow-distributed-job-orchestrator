import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { env } from "../config/env.js";

let pool: Pool | null = null;
let schemaInitialized = false;
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const getPool = () => {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  return pool;
};

export const query = async <T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) => getPool().query<T>(text, values);

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
) => {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const initDb = async () => {
  if (schemaInitialized) {
    return;
  }

  const schemaPath = path.resolve(moduleDir, "../../src/db/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  await getPool().query(schemaSql);
  schemaInitialized = true;
};
