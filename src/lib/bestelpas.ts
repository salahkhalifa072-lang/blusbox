import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * De bestelpas: het bewijs dat deze browser bij een bestelling hoort.
 *
 * De bestelpagina (/bestelling/<nummer>) toonde aan iedereen het
 * bezorgadres, en bestelnummers lopen gewoon op: wie een nummer raadde,
 * zag het adres van die klant. Sinds 25 november 2026 zijn de gegevens
 * alleen te zien met een pas voor dát bestelnummer (of als beheerder, of
 * ingelogd als de klant zelf).
 *
 * Een pas is het bestelnummer met een handtekening eronder. Zonder het
 * servergeheim is die niet na te maken, dus een nummer raden levert niets
 * meer op. Hij komt op twee manieren bij de klant: als cookie op het
 * moment van bestellen, en als code in de link waarmee de betaalpagina
 * terugstuurt (voor wie na iDEAL in een andere browser uitkomt).
 *
 * Het geheim komt uit AUTH_SECRET met een eigen label, om dezelfde reden
 * als bij de affiliatecookie: één sleutel voor twee doelen maakt een
 * handtekening uit het ene systeem geldig in het andere.
 */

export const BESTELPAS_COOKIE = "bb_bestelling";
/** Dertig dagen: ruim genoeg om de bevestiging nog eens te openen. */
export const BESTELPAS_MAX_LEEFTIJD = 60 * 60 * 24 * 30;
/** Niet meer dan zoveel bestellingen in één cookie; de oudste valt af. */
const MAX_PASSEN = 5;

function sleutel(): Buffer {
  const geheim = process.env.AUTH_SECRET;
  if (!geheim) {
    throw new Error("AUTH_SECRET ontbreekt; zonder servergeheim is een bestelpas niet te ondertekenen.");
  }
  return createHmac("sha256", geheim).update("blusbox-bestelpas-v1").digest();
}

/** De handtekening bij een bestelnummer; dit is ook de code in de teruglink. */
export function pasCode(ordernummer: string): string {
  return createHmac("sha256", sleutel()).update(ordernummer).digest("base64url").slice(0, 32);
}

/** Klopt de code bij dit bestelnummer? Vergelijkt in vaste tijd, gooit nooit. */
export function pasKlopt(ordernummer: string, code: string | null | undefined): boolean {
  if (!code) return false;
  let verwacht: string;
  try {
    verwacht = pasCode(ordernummer);
  } catch {
    return false;
  }
  const a = Buffer.from(code);
  const b = Buffer.from(verwacht);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** De geldige bestelnummers uit een cookiewaarde; rommel valt eruit. */
export function leesPassen(waarde: string | undefined): string[] {
  if (!waarde) return [];
  const nummers: string[] = [];
  for (const deel of waarde.split(",").slice(0, MAX_PASSEN * 2)) {
    const punt = deel.lastIndexOf(".");
    if (punt <= 0) continue;
    const nummer = deel.slice(0, punt);
    if (pasKlopt(nummer, deel.slice(punt + 1)) && !nummers.includes(nummer)) nummers.push(nummer);
  }
  return nummers;
}

/** De nieuwe cookiewaarde nadat dit bestelnummer erbij is gekomen (nieuwste voorop). */
export function metPas(waarde: string | undefined, ordernummer: string): string {
  const nummers = [ordernummer, ...leesPassen(waarde).filter((n) => n !== ordernummer)].slice(0, MAX_PASSEN);
  return nummers.map((n) => `${n}.${pasCode(n)}`).join(",");
}
