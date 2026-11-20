import { and, eq, lt, sql } from "drizzle-orm";
import { db, tweestaps } from "@/db";
import {
  controleerCode,
  hashHerstelcode,
  lijktOpHerstelcode,
  nieuweHerstelcodes,
  nieuwGeheim,
  ontsleutel,
  versleutel,
} from "@/lib/totp";

/**
 * Tweestapsverificatie: de kant die de database raakt.
 *
 * De afweging die overal terugkomt: een beheerder die zichzelf buitensluit
 * is vervelend, iemand anders die binnenkomt is erger. Daarom slot na vijf
 * foute codes, en herstelcodes plus een opdrachtregelscript voor wie zijn
 * telefoon kwijt is.
 */

const MAX_MISLUKT = 5;
const SLOT_MS = 15 * 60 * 1000;

export type TweestapsStatus = {
  actief: boolean;
  actiefOp: Date | null;
  herstelcodesOver: number;
  geblokkeerdTot: Date | null;
};

async function rijVan(userId: string) {
  const [rij] = await db
    .select()
    .from(tweestaps)
    .where(eq(tweestaps.userId, userId))
    .limit(1);
  return rij ?? null;
}

export async function tweestapsStatus(userId: string): Promise<TweestapsStatus> {
  const rij = await rijVan(userId);
  const geblokkeerd =
    rij?.geblokkeerdTot && rij.geblokkeerdTot.getTime() > Date.now()
      ? rij.geblokkeerdTot
      : null;
  return {
    actief: Boolean(rij?.actiefOp),
    actiefOp: rij?.actiefOp ?? null,
    herstelcodesOver: rij?.actiefOp ? rij.herstelcodes.length : 0,
    geblokkeerdTot: geblokkeerd,
  };
}

export async function tweestapsActief(userId: string): Promise<boolean> {
  const rij = await rijVan(userId);
  return Boolean(rij?.actiefOp);
}

export type CodeUitkomst = "goed" | "fout" | "geblokkeerd" | "niet-actief";

/**
 * Controleert een code uit de app óf een herstelcode, en houdt bij wat er
 * gebeurt: gebruikte stap, verbruikte herstelcode, foute pogingen.
 *
 * Met `alleenBevestigd: false` telt ook een nog niet bevestigde koppeling;
 * dat is de eerste code bij het instellen.
 */
export async function controleerInlogcode(
  userId: string,
  invoer: string,
  { alleenBevestigd = true }: { alleenBevestigd?: boolean } = {},
): Promise<CodeUitkomst> {
  const rij = await rijVan(userId);
  if (!rij || (alleenBevestigd && !rij.actiefOp)) return "niet-actief";

  const nu = Date.now();
  if (rij.geblokkeerdTot && rij.geblokkeerdTot.getTime() > nu) return "geblokkeerd";

  // Herstelcode: alleen als de koppeling al bevestigd is, anders bestaan
  // ze nog niet. Na gebruik is hij weg.
  if (rij.actiefOp && lijktOpHerstelcode(invoer)) {
    const hash = hashHerstelcode(invoer);
    // Voorwaardelijk bijwerken: twee gelijktijdige pogingen met dezelfde
    // code kunnen zo niet allebei slagen.
    const verbruikt = await db
      .update(tweestaps)
      .set({
        herstelcodes: sql`${tweestaps.herstelcodes} - ${hash}::text`,
        mislukt: 0,
        geblokkeerdTot: null,
      })
      .where(and(eq(tweestaps.userId, userId), sql`${tweestaps.herstelcodes} ? ${hash}`))
      .returning({ userId: tweestaps.userId });
    if (verbruikt.length > 0) return "goed";
  } else {
    const stap = controleerCode(
      ontsleutel(rij.geheimVersleuteld),
      invoer,
      nu,
      rij.laatsteStap,
    );
    if (stap !== null) {
      const bijgewerkt = await db
        .update(tweestaps)
        .set({ laatsteStap: stap, mislukt: 0, geblokkeerdTot: null })
        .where(and(eq(tweestaps.userId, userId), lt(tweestaps.laatsteStap, stap)))
        .returning({ userId: tweestaps.userId });
      if (bijgewerkt.length > 0) return "goed";
    }
  }

  const mislukt = rij.mislukt + 1;
  const opSlot = mislukt >= MAX_MISLUKT;
  await db
    .update(tweestaps)
    .set({
      mislukt: opSlot ? 0 : mislukt,
      geblokkeerdTot: opSlot ? new Date(nu + SLOT_MS) : rij.geblokkeerdTot,
    })
    .where(eq(tweestaps.userId, userId));
  return opSlot ? "geblokkeerd" : "fout";
}

/**
 * Begint een koppeling: nieuw geheim, nog niet actief. Staat er al een
 * werkende koppeling, dan blijft die staan; die zet je eerst uit.
 */
export async function startKoppeling(userId: string): Promise<string | null> {
  const rij = await rijVan(userId);
  if (rij?.actiefOp) return null;

  // Een eerder gestart maar niet afgemaakt geheim hergebruiken: anders
  // klopt de QR-code die al in de app staat niet meer na een verversing.
  if (rij) return ontsleutel(rij.geheimVersleuteld);

  const geheim = nieuwGeheim();
  await db
    .insert(tweestaps)
    .values({ userId, geheimVersleuteld: versleutel(geheim) })
    .onConflictDoNothing();
  const opnieuw = await rijVan(userId);
  return opnieuw ? ontsleutel(opnieuw.geheimVersleuteld) : null;
}

/** Eerste code klopt: koppeling aan, en de herstelcodes (eenmalig leesbaar). */
export async function bevestigKoppeling(
  userId: string,
  code: string,
): Promise<{ uitkomst: CodeUitkomst; herstelcodes?: string[] }> {
  const rij = await rijVan(userId);
  if (!rij) return { uitkomst: "niet-actief" };
  if (rij.actiefOp) return { uitkomst: "goed" };

  const uitkomst = await controleerInlogcode(userId, code, { alleenBevestigd: false });
  if (uitkomst !== "goed") return { uitkomst };

  const herstelcodes = nieuweHerstelcodes();
  await db
    .update(tweestaps)
    .set({ actiefOp: new Date(), herstelcodes: herstelcodes.map(hashHerstelcode) })
    .where(eq(tweestaps.userId, userId));
  return { uitkomst, herstelcodes };
}

/** Nieuwe herstelcodes; de oude vervallen allemaal. Vraagt een geldige code. */
export async function vernieuwHerstelcodes(
  userId: string,
  code: string,
): Promise<{ uitkomst: CodeUitkomst; herstelcodes?: string[] }> {
  const uitkomst = await controleerInlogcode(userId, code);
  if (uitkomst !== "goed") return { uitkomst };
  const herstelcodes = nieuweHerstelcodes();
  await db
    .update(tweestaps)
    .set({ herstelcodes: herstelcodes.map(hashHerstelcode) })
    .where(eq(tweestaps.userId, userId));
  return { uitkomst, herstelcodes };
}

/** Uitzetten vraagt een geldige code: een open laptop is niet genoeg. */
export async function zetTweestapsUit(
  userId: string,
  code: string,
): Promise<CodeUitkomst> {
  const uitkomst = await controleerInlogcode(userId, code);
  if (uitkomst === "goed") {
    await db.delete(tweestaps).where(eq(tweestaps.userId, userId));
  }
  return uitkomst;
}

/** Een half afgemaakte koppeling weggooien, om opnieuw te beginnen. */
export async function annuleerKoppeling(userId: string): Promise<void> {
  const rij = await rijVan(userId);
  if (rij && !rij.actiefOp) {
    await db.delete(tweestaps).where(eq(tweestaps.userId, userId));
  }
}

/** Het geheim van een gestarte maar nog niet bevestigde koppeling. */
export async function lopendeKoppeling(userId: string): Promise<string | null> {
  const rij = await rijVan(userId);
  if (!rij || rij.actiefOp) return null;
  return ontsleutel(rij.geheimVersleuteld);
}
