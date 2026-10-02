import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { credentials } from "@/db/auth-schema";
import { users, wachtwoordHerstel } from "@/db/schema";
import { hashWachtwoord } from "@/lib/wachtwoord";
import {
  MAX_AANVRAGEN_PER_UUR,
  beoordeelHerstel,
  hashToken,
  maakToken,
  verlooptOp,
  type HerstelOordeel,
} from "@/lib/wachtwoord-herstel";

/**
 * Wachtwoordherstel: ophalen, aanmaken, inwisselen.
 *
 * Het oordeel over een token staat in lib/wachtwoord-herstel.ts en is
 * daar los getest; hier staat alleen wat de database raakt.
 */

/**
 * Een herstel aanvragen.
 *
 * Geeft het token terug als er een mail gestuurd moet worden, en null in
 * alle andere gevallen — onbekend adres, of te vaak gevraagd. De
 * aanroeper laat dat verschil nooit aan de bezoeker zien: wie kan
 * aflezen of een adres bestaat, heeft een ledenlijst.
 */
export async function vraagHerstelAan(
  email: string,
): Promise<{ token: string; userId: string; naam: string | null } | null> {
  const genormaliseerd = email.trim().toLowerCase();
  if (!genormaliseerd) return null;

  const [gebruiker] = await db
    .select({ id: users.id, naam: users.name })
    .from(users)
    .where(eq(users.email, genormaliseerd))
    .limit(1);
  if (!gebruiker) return null;

  /*
   * Hoeveel aanvragen deed dit account het afgelopen uur? Niet om
   * misbruik te stoppen — met één adres lukt dat toch niet — maar om te
   * voorkomen dat iemands postvak als pesterij wordt volgelopen.
   */
  const eenUurGeleden = new Date(Date.now() - 60 * 60 * 1000);
  const [{ aantal }] = await db
    .select({ aantal: sql<number>`count(*)::int` })
    .from(wachtwoordHerstel)
    .where(
      and(
        eq(wachtwoordHerstel.userId, gebruiker.id),
        gt(wachtwoordHerstel.aangemaaktOp, eenUurGeleden),
      ),
    );
  if (aantal >= MAX_AANVRAGEN_PER_UUR) return null;

  const { token, hash } = maakToken();
  await db.insert(wachtwoordHerstel).values({
    userId: gebruiker.id,
    tokenHash: hash,
    verlooptOp: verlooptOp(),
  });

  return { token, userId: gebruiker.id, naam: gebruiker.naam };
}

/** Een token beoordelen zonder het in te wisselen — voor het tonen van het formulier. */
export async function beoordeelToken(token: string): Promise<HerstelOordeel> {
  const [rij] = await db
    .select({
      userId: wachtwoordHerstel.userId,
      tokenHash: wachtwoordHerstel.tokenHash,
      verlooptOp: wachtwoordHerstel.verlooptOp,
      gebruiktOp: wachtwoordHerstel.gebruiktOp,
    })
    .from(wachtwoordHerstel)
    .where(eq(wachtwoordHerstel.tokenHash, hashToken(token)))
    .limit(1);

  return beoordeelHerstel(rij ?? null, token, new Date());
}

/**
 * Het token inwisselen voor een nieuw wachtwoord.
 *
 * Alles in één transactie, en het token wordt afgetekend met een
 * voorwaarde op `gebruikt_op IS NULL` in de UPDATE zelf. Twee verzoeken
 * die tegelijk binnenkomen — twee tabbladen, of een dubbelklik — zouden
 * anders allebei door een controle vooraf heen glippen. Een controle in
 * code verliest van een race; de database niet.
 */
export async function wisselTokenIn(
  token: string,
  nieuwWachtwoord: string,
): Promise<{ gelukt: true } | { gelukt: false; reden: string }> {
  const oordeel = await beoordeelToken(token);
  if (!oordeel.geldig) return { gelukt: false, reden: oordeel.reden };

  const hash = await hashWachtwoord(nieuwWachtwoord);

  return db.transaction(async (tx) => {
    const afgetekend = await tx
      .update(wachtwoordHerstel)
      .set({ gebruiktOp: new Date() })
      .where(
        and(
          eq(wachtwoordHerstel.tokenHash, hashToken(token)),
          sql`${wachtwoordHerstel.gebruiktOp} IS NULL`,
          gt(wachtwoordHerstel.verlooptOp, new Date()),
        ),
      )
      .returning({ userId: wachtwoordHerstel.userId });

    if (afgetekend.length === 0) {
      return {
        gelukt: false as const,
        reden:
          "Deze herstellink werkt niet meer. Hij is verlopen of al gebruikt; vraag een nieuwe aan.",
      };
    }

    const userId = afgetekend[0].userId;

    // Had dit account nog geen wachtwoord — bijvoorbeeld een oud account
    // uit de tijd van de magic link — dan komt het er nu bij.
    await tx
      .insert(credentials)
      .values({ userId, wachtwoordHash: hash })
      .onConflictDoUpdate({
        target: credentials.userId,
        set: { wachtwoordHash: hash },
      });

    /*
     * Alle andere openstaande tokens van deze gebruiker vervallen. Wie
     * drie keer op "vergeten" drukte heeft drie geldige links in zijn
     * postvak; na het herstel hoort geen daarvan nog te werken.
     */
    await tx
      .update(wachtwoordHerstel)
      .set({ gebruiktOp: new Date() })
      .where(
        and(
          eq(wachtwoordHerstel.userId, userId),
          sql`${wachtwoordHerstel.gebruiktOp} IS NULL`,
        ),
      );

    return { gelukt: true as const };
  });
}
