import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { kortingscodes } from "@/db/schema";
import {
  beoordeelCode,
  normaliseerCode,
  type KortingOordeel,
  type Kortingscode,
} from "@/lib/korting";

/**
 * Kortingscodes ophalen en bijhouden.
 *
 * Het oordeel zelf staat in lib/korting.ts en is daar los getest; hier
 * staat alleen het halen en schrijven.
 */

/** Eén code opzoeken. Null als hij niet bestaat. */
export async function zoekCode(invoer: string): Promise<Kortingscode | null> {
  const code = normaliseerCode(invoer);
  if (!code) return null;

  try {
    const [rij] = await db
      .select({
        code: kortingscodes.code,
        omschrijving: kortingscodes.omschrijving,
        percentageBp: kortingscodes.percentageBp,
        actief: kortingscodes.actief,
        geldigTot: kortingscodes.geldigTot,
        maxGebruik: kortingscodes.maxGebruik,
        aantalGebruikt: kortingscodes.aantalGebruikt,
      })
      .from(kortingscodes)
      .where(eq(kortingscodes.code, code))
      .limit(1);
    return rij ?? null;
  } catch (fout) {
    /*
     * Bestaat de tabel nog niet — een preview-branch waar 0007 nog niet
     * is gedraaid — dan is er geen korting, geen foutpagina en geen
     * geblokkeerde afrekening. Een kapotte winkelwagen is een veel
     * groter probleem dan een code die even niet werkt.
     */
    console.error("Kortingscode niet opgezocht:", (fout as Error).message);
    return null;
  }
}

/** Opzoeken en meteen beoordelen. Dit is wat de afrekenpagina gebruikt. */
export async function beoordeelInvoer(invoer: string): Promise<KortingOordeel> {
  return beoordeelCode(await zoekCode(invoer), new Date());
}

/**
 * Een gebruik bijschrijven, nadat de bestelling is aangemaakt.
 *
 * Het ophogen gebeurt in de database met `aantal_gebruikt + 1` en niet
 * door een gelezen waarde terug te schrijven: twee klanten die op
 * dezelfde seconde afrekenen zouden anders samen voor één gebruik
 * doorgaan, en bij een code met een maximum is dat precies het verschil
 * tussen honderd en honderdtwintig keer uitgedeelde korting.
 *
 * De voorwaarde op `max_gebruik` zit in de WHERE en niet in code
 * ervoor. Een controle vooraf verliest van een race; de database niet.
 */
export async function schrijfGebruikBij(code: string): Promise<boolean> {
  const genormaliseerd = normaliseerCode(code);
  if (!genormaliseerd) return false;

  try {
    const bijgewerkt = await db
      .update(kortingscodes)
      .set({ aantalGebruikt: sql`${kortingscodes.aantalGebruikt} + 1` })
      .where(
        and(
          eq(kortingscodes.code, genormaliseerd),
          sql`(${kortingscodes.maxGebruik} IS NULL OR ${kortingscodes.aantalGebruikt} < ${kortingscodes.maxGebruik})`,
        ),
      )
      .returning({ code: kortingscodes.code });
    return bijgewerkt.length > 0;
  } catch (fout) {
    console.error("Kortinggebruik niet bijgeschreven:", (fout as Error).message);
    return false;
  }
}

/** Alle codes, voor het beheerscherm. */
export async function alleCodes() {
  return db
    .select()
    .from(kortingscodes)
    .orderBy(kortingscodes.aangemaaktOp);
}

/** Een code aan- of uitzetten vanuit het dashboard. */
export async function zetActief(code: string, actief: boolean): Promise<void> {
  await db
    .update(kortingscodes)
    .set({ actief })
    .where(eq(kortingscodes.code, normaliseerCode(code)));
}
