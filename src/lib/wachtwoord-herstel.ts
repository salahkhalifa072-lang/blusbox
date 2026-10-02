import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Wachtwoordherstel: de tokens en de regels eromheen.
 *
 * Twee dingen bepalen de vorm van de link, en allebei komen ze uit wat er
 * eerder misging met de magic link (zie auth.ts). Chrome zette daar een
 * "Gevaarlijke site"-waarschuwing voor, niet omdat er iets mis was maar
 * omdat de URL het profiel van phishing had: een redirect-parameter, een
 * lang geheim en het e-mailadres van de ontvanger, alle drie in de
 * querystring, aangeklikt vanuit een e-mail.
 *
 * Daarom staat het token hier in het pad en niet in een querystring, gaat
 * het e-mailadres niet mee, en is er geen redirect-parameter. Wat
 * overblijft is /wachtwoord/herstel/<token> — kort, schoon, en van je
 * eigen domein.
 *
 * In de database staat alleen een hash van het token. Een gelekte
 * databasekopie levert dan geen bruikbare herstellinks op; dat is precies
 * het verschil tussen een vervelend incident en overgenomen accounts.
 */

/** Een uur. Lang genoeg om een mail te vinden, kort genoeg om niet te blijven liggen. */
export const GELDIGHEID_MINUTEN = 60;

/**
 * Hoeveel aanvragen per adres per uur. Niet om misbruik te stoppen — dat
 * lukt met één adres toch niet — maar om te voorkomen dat iemands postvak
 * als pesterij wordt volgelopen.
 */
export const MAX_AANVRAGEN_PER_UUR = 5;

/** Een nieuw token: het geheim voor in de link, en de hash voor de database. */
export function maakToken(): { token: string; hash: string } {
  // 32 bytes, base64url: 43 tekens zonder tekens die in een URL
  // ontsnapt moeten worden.
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

/**
 * SHA-256 en geen scrypt zoals bij wachtwoorden.
 *
 * Een wachtwoord is kort en te raden, dus daar moet het hashen traag
 * zijn. Dit token is 256 bits willekeur — niet te raden, dus traag hashen
 * voegt niets toe en zou elke herstelpagina seconden kosten.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Vergelijken zonder dat de duur iets over de inhoud verraadt. */
export function tokenKlopt(token: string, bewaardeHash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(bewaardeHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Alleen de vorm die maakToken() oplevert; de rest hoeft de database niet te zien. */
export function geldigeTokenvorm(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function verlooptOp(nu: Date = new Date()): Date {
  return new Date(nu.getTime() + GELDIGHEID_MINUTEN * 60 * 1000);
}

export type HerstelRij = {
  userId: string;
  tokenHash: string;
  verlooptOp: Date;
  gebruiktOp: Date | null;
};

export type HerstelOordeel =
  | { geldig: true; userId: string }
  | { geldig: false; reden: string };

/**
 * Mag dit token nu een wachtwoord zetten?
 *
 * Eén melding voor "bestaat niet", "verlopen" en "al gebruikt": wie een
 * token raadt hoort niet te leren of hij in de buurt zat. De tekst zegt
 * wel wat de bezoeker moet doen, want de eerlijke uitkomst is in alle
 * drie de gevallen dezelfde — vraag een nieuwe aan.
 */
export function beoordeelHerstel(
  rij: HerstelRij | null,
  token: string,
  nu: Date = new Date(),
): HerstelOordeel {
  const ongeldig = {
    geldig: false as const,
    reden:
      "Deze herstellink werkt niet meer. Hij is verlopen of al gebruikt; vraag een nieuwe aan.",
  };

  if (!rij) return ongeldig;
  if (!tokenKlopt(token, rij.tokenHash)) return ongeldig;
  if (rij.gebruiktOp) return ongeldig;
  if (rij.verlooptOp.getTime() <= nu.getTime()) return ongeldig;

  return { geldig: true, userId: rij.userId };
}

/** De link zoals hij in de mail komt. Pad, geen querystring. */
export function herstelUrl(basis: string, token: string): string {
  return `${basis.replace(/\/$/, "")}/wachtwoord/herstel/${token}`;
}
