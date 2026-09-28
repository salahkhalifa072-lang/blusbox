import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * De attributiecookie.
 *
 * Waarom ondertekend en niet gewoon het affiliate-id erin: een cookie is
 * een stuk tekst dat de bezoeker zelf kan aanpassen. Zonder handtekening
 * kan iedereen er een willekeurig affiliate-id in zetten en daarmee
 * commissie naar een ander sturen — of naar zichzelf, bij elke bestelling
 * die er toch al kwam. De handtekening maakt dat onmogelijk zonder het
 * servergeheim.
 *
 * Wat er in zit: het affiliate-id, het id van de klik en het tijdstip.
 * Meer niet. Geen naam, geen e-mailadres, geen bestelgeschiedenis. En
 * httpOnly, dus JavaScript op de pagina komt er niet bij — ook niet dat
 * van een ingesloten script van derden.
 *
 * Het geheim komt uit AUTH_SECRET, met een eigen label ervoor. Dat label
 * is geen sier: dezelfde sleutel voor twee doelen gebruiken betekent dat
 * een handtekening uit het ene systeem geldig kan zijn in het andere. Door
 * het label is de afgeleide sleutel hier een andere dan die van Auth.js,
 * zonder dat er een tweede omgevingsvariabele bij komt die iemand moet
 * instellen voordat dit werkt.
 */

export const AFFILIATE_COOKIE = "bb_aff";

export type Attributie = {
  affiliateId: string;
  klikId: string;
  /** Milliseconden sinds epoch. */
  klikOp: number;
};

function sleutel(): Buffer {
  const geheim = process.env.AUTH_SECRET;
  if (!geheim) {
    throw new Error(
      "AUTH_SECRET ontbreekt; zonder servergeheim is affiliate-attributie niet te ondertekenen.",
    );
  }
  return createHmac("sha256", geheim).update("blusbox-affiliate-v1").digest();
}

function handtekening(inhoud: string): string {
  return createHmac("sha256", sleutel()).update(inhoud).digest("base64url");
}

/** Bouwt de cookiewaarde: inhoud en handtekening, gescheiden door een punt. */
export function schrijfAttributie(a: Attributie): string {
  const inhoud = [a.affiliateId, a.klikId, String(a.klikOp)].join("|");
  const basis = Buffer.from(inhoud, "utf8").toString("base64url");
  return `${basis}.${handtekening(basis)}`;
}

/**
 * Leest en controleert de cookiewaarde.
 *
 * Geeft null terug bij alles wat niet klopt: ontbrekend, verminkt, een
 * verkeerde handtekening of een tijdstip dat in de toekomst ligt. Nooit
 * een uitzondering — een rommelige cookie van een bezoeker mag geen
 * pagina laten crashen.
 */
export function leesAttributie(waarde: string | undefined): Attributie | null {
  if (!waarde) return null;

  const punt = waarde.lastIndexOf(".");
  if (punt <= 0) return null;

  const basis = waarde.slice(0, punt);
  const gegeven = waarde.slice(punt + 1);

  let verwacht: string;
  try {
    verwacht = handtekening(basis);
  } catch {
    return null;
  }

  // Vergelijken in vaste tijd. Een gewone === verraadt via het tijdverschil
  // hoeveel tekens er klopten, en daarmee is een handtekening teken voor
  // teken te raden.
  const a = Buffer.from(gegeven);
  const b = Buffer.from(verwacht);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let inhoud: string;
  try {
    inhoud = Buffer.from(basis, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const [affiliateId, klikId, klikOpRuw] = inhoud.split("|");
  const klikOp = Number(klikOpRuw);

  if (!affiliateId || !klikId || !Number.isFinite(klikOp)) return null;
  // Een tijdstip in de toekomst kan alleen van een verzette klok of een
  // poging tot oprekken komen; allebei reden om hem te negeren.
  if (klikOp > Date.now() + 60_000) return null;

  return { affiliateId, klikId, klikOp };
}

/** Opties voor het zetten van de cookie, op één plek zodat ze niet uiteenlopen. */
export function cookieOpties(attributieDagen: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: attributieDagen * 24 * 60 * 60,
  };
}
