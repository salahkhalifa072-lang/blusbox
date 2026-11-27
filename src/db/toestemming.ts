import { desc, gte, sql } from "drizzle-orm";
import { db } from "./index";
import { toestemmingTellingen } from "./schema";

export type Toestemmingskeuze = "verleend" | "geweigerd" | "getoond";

/** Vandaag in Nederland, als JJJJ-MM-DD. */
function vandaag(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
}

/** Eén vertoning of klik bijtellen. Eén rij per dag per soort. */
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

export type CookievraagDag = {
  /** JJJJ-MM-DD, Nederlandse tijd. */
  dag: string;
  getoond: number;
  verleend: number;
  geweigerd: number;
  /**
   * Getoond min akkoord min weigeren: weggegaan zonder te kiezen. Null op
   * dagen zonder "getoond" (vóór 26 november 2026 werd dat niet geteld),
   * want dan zegt het verschil niets.
   */
  zonderKeuze: number | null;
};

/** Per dag, nieuwste eerst: hoe vaak getoond, akkoord, geweigerd en zonder keuze. */
export async function cookievraagPerDag(dagen = 14): Promise<CookievraagDag[]> {
  const som = (soort: Toestemmingskeuze) =>
    sql<number>`coalesce(sum(${toestemmingTellingen.aantal}) filter (where ${toestemmingTellingen.keuze} = ${soort}), 0)`.mapWith(Number);

  const rijen = await db
    .select({
      dag: toestemmingTellingen.dag,
      getoond: som("getoond"),
      verleend: som("verleend"),
      geweigerd: som("geweigerd"),
    })
    .from(toestemmingTellingen)
    .where(gte(toestemmingTellingen.dag, sql`(current_date - ${dagen}::int)`))
    .groupBy(toestemmingTellingen.dag)
    .orderBy(desc(toestemmingTellingen.dag));

  return rijen.map((r) => ({
    ...r,
    dag: String(r.dag),
    // Nooit onder nul: een klik kan net na middernacht vallen terwijl de
    // vertoning nog op de dag ervoor staat.
    zonderKeuze: r.getoond > 0 ? Math.max(0, r.getoond - r.verleend - r.geweigerd) : null,
  }));
}
