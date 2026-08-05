import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

/**
 * Database handle.
 *
 * The Auth.js Drizzle adapter inspects the instance to detect the dialect,
 * so `db` must be a real Drizzle object at module load — a lazy proxy makes
 * the adapter fail with "Unsupported database type".
 *
 * Next collects page data for every route during `next build`, which
 * imports this module. Requiring DATABASE_URL there would make the build
 * depend on a live database, so during the build phase only we fall back
 * to a placeholder. postgres-js connects lazily, so nothing dials out;
 * any real query outside the build still needs a real URL.
 */

const volledigSchema = { ...schema, ...authSchema };

const isBuildFase = process.env.NEXT_PHASE === "phase-production-build";
const url = process.env.DATABASE_URL;

if (!url && !isBuildFase) {
  throw new Error(
    "DATABASE_URL ontbreekt. Zet hem in .env.local (zie .env.example).",
  );
}

const globalForDb = globalThis as unknown as {
  blusboxClient?: ReturnType<typeof postgres>;
};

// Reuse the pool across hot reloads; a fresh pool per edit exhausts
// Postgres connections within a few saves.
const client =
  globalForDb.blusboxClient ??
  postgres(url ?? "postgres://placeholder@127.0.0.1:5432/build", { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.blusboxClient = client;
}

export const db = drizzle(client, { schema: volledigSchema });

export * from "./schema";
export * from "./auth-schema";
