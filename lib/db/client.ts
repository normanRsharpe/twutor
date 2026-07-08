import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: postgres.Sql | undefined;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL;
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required for database reads. Use Railway Postgres or railway run.");
  }
  client ??= postgres(url, { max: 1, prepare: false });
  return drizzle(client, { schema });
}
