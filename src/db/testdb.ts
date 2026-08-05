import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

/**
 * Throwaway in-process Postgres for integration tests.
 *
 * PGlite is real Postgres compiled to WASM, so the generated migration is
 * executed verbatim — enums, foreign keys, indexes and all. That means the
 * tests exercise the same SQL the production database will run, without
 * anyone needing a server installed to run `npm test`.
 */
export async function maakTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema: { ...schema, ...authSchema } });

  const map = path.join(process.cwd(), "drizzle");
  const bestanden = readdirSync(map)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const bestand of bestanden) {
    const sql = readFileSync(path.join(map, bestand), "utf8");
    // drizzle-kit separates statements with this marker
    for (const statement of sql.split("--> statement-breakpoint")) {
      const schoon = statement.trim();
      if (schoon) await client.exec(schoon);
    }
  }

  return { db, client };
}
