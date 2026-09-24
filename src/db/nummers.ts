import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { orders } from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = Pick<PgDatabase<any, any, any>, "select">;

/**
 * BB-2026-000123. The counter is per calendar year and derived from the
 * highest existing number, inside the same transaction as the insert, so
 * two simultaneous checkouts cannot claim the same number.
 *
 * Staat los van lib/bestelling zodat ook de balieverkoop hem gebruikt, en
 * zonder bij het importeren een databaseverbinding te eisen.
 */
export async function volgendOrdernummer(tx: Db, jaar: number): Promise<string> {
  const prefix = `BB-${jaar}-`;
  const [rij] = await tx
    .select({
      hoogste: sql<string | null>`max(${orders.ordernummer})`,
    })
    .from(orders)
    .where(sql`${orders.ordernummer} like ${prefix + "%"}`);

  const vorig = rij?.hoogste ? Number(rij.hoogste.slice(prefix.length)) : 0;
  const volgend = (Number.isFinite(vorig) ? vorig : 0) + 1;
  return prefix + String(volgend).padStart(6, "0");
}
