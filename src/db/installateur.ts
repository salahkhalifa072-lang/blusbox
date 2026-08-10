import { and, asc, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "./index";
import { lots, registeredUnits } from "./schema";
import { plusMaanden, type IsoDatum } from "@/lib/levensduur";

/**
 * §9.6 installer portal queries.
 *
 * Every query filters on installateurId in the WHERE clause — an installer
 * must never be able to read another company's placements, and that has to
 * be enforced in SQL rather than by hiding rows in a template.
 */

export async function eigenUnits(installateurId: string, limiet = 200) {
  return db
    .select({
      id: registeredUnits.id,
      lotNummer: lots.lotNummer,
      installatiedatum: registeredUnits.installatiedatum,
      vervaldatum: registeredUnits.vervaldatum,
      locatieType: registeredUnits.locatieType,
      postcode: registeredUnits.postcode,
      serienummer: registeredUnits.serienummer,
      herinnering12Op: registeredUnits.herinnering12Op,
    })
    .from(registeredUnits)
    .innerJoin(lots, eq(lots.id, registeredUnits.lotId))
    .where(eq(registeredUnits.installateurId, installateurId))
    .orderBy(asc(registeredUnits.vervaldatum))
    .limit(limiet);
}

export async function eigenCijfers(
  installateurId: string,
  vandaag: IsoDatum,
) {
  const [totaal] = await db
    .select({ aantal: count() })
    .from(registeredUnits)
    .where(eq(registeredUnits.installateurId, installateurId));

  const [binnenJaar] = await db
    .select({ aantal: count() })
    .from(registeredUnits)
    .where(
      and(
        eq(registeredUnits.installateurId, installateurId),
        gte(registeredUnits.vervaldatum, vandaag),
        lte(registeredUnits.vervaldatum, plusMaanden(vandaag, 12)),
      ),
    );

  const [verlopen] = await db
    .select({ aantal: count() })
    .from(registeredUnits)
    .where(
      and(
        eq(registeredUnits.installateurId, installateurId),
        sql`${registeredUnits.vervaldatum} < ${vandaag}`,
      ),
    );

  return {
    geplaatst: Number(totaal?.aantal ?? 0),
    verlooptBinnenJaar: Number(binnenJaar?.aantal ?? 0),
    verlopen: Number(verlopen?.aantal ?? 0),
  };
}

/** Lots this installer can pick from when registering a placement. */
export async function beschikbareLots() {
  return db
    .select({ id: lots.id, lotNummer: lots.lotNummer })
    .from(lots)
    .orderBy(asc(lots.lotNummer));
}
