import { gte, sql } from "drizzle-orm";
import { db } from "./index";
import { toestemmingTellingen } from "./schema";

export type Toestemmingskeuze = "verleend" | "geweigerd";

/** Vandaag in Nederland, als JJJJ-MM-DD. */
function vandaag(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
}

/** Eén klik bijtellen. Eén rij per dag per keuze. */
export async function telToestemming(keuze: Toestemmingskeuze): Promise<void> {
  await db
    .insert(toestemmingTellingen)
    .values({ dag: vandaag(), keuze, aantal: 1 })
    .onConflictDoUpdate({
      target: [toestemmingTellingen.dag, toestemmingTellingen.keuze],
      set: { aantal: sql`${toestemmingTellingen.aantal} + 1` },
    });
}

/** Totalen over de laatste dagen, voor het dashboard. */
export async function toestemmingOverzicht(dagen = 30) {
  const [rij] = await db
    .select({
      verleend: sql<number>`coalesce(sum(${toestemmingTellingen.aantal}) filter (where ${toestemmingTellingen.keuze} = 'verleend'), 0)`.mapWith(Number),
      geweigerd: sql<number>`coalesce(sum(${toestemmingTellingen.aantal}) filter (where ${toestemmingTellingen.keuze} = 'geweigerd'), 0)`.mapWith(Number),
    })
    .from(toestemmingTellingen)
    .where(gte(toestemmingTellingen.dag, sql`(current_date - ${dagen}::int)`));
  const verleend = rij?.verleend ?? 0;
  const geweigerd = rij?.geweigerd ?? 0;
  const totaal = verleend + geweigerd;
  return {
    verleend,
    geweigerd,
    totaal,
    /** Aandeel akkoord in hele procenten, of null zolang er niets geteld is. */
    procentAkkoord: totaal > 0 ? Math.round((verleend / totaal) * 100) : null,
  };
}
