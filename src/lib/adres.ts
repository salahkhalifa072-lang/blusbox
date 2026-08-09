/**
 * Address and tax-number validation for checkout.
 *
 * Dutch postcodes are validated by shape only. We deliberately do not
 * guess a street from a postcode without a real lookup service: a wrong
 * street on a dangerous-goods shipment is worse than an empty field.
 */

/** 1234 AB — four digits, then two letters. Never starting with a 0. */
const NL_POSTCODE = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;

/** Belgian postcodes are four digits. */
const BE_POSTCODE = /^[1-9][0-9]{3}$/;

export function geldigePostcode(postcode: string, landcode: string): boolean {
  const schoon = postcode.trim();
  switch (landcode.toUpperCase()) {
    case "NL":
      return NL_POSTCODE.test(schoon);
    case "BE":
      return BE_POSTCODE.test(schoon);
    default:
      return schoon.length > 0;
  }
}

/** Store postcodes uniformly as 1234AB, so lookups match. */
export function normaliseerPostcode(
  postcode: string,
  landcode: string,
): string {
  const schoon = postcode.trim().replace(/\s+/g, "").toUpperCase();
  return landcode.toUpperCase() === "NL" ? schoon : schoon;
}

/** House number with optional addition: 12, 12A, 12-bis, 12 hs */
const HUISNUMMER = /^[0-9]{1,5}\s?[A-Za-z0-9\-]{0,6}$/;

export function geldigHuisnummer(huisnummer: string): boolean {
  return HUISNUMMER.test(huisnummer.trim());
}

export function geldigEmail(email: string): boolean {
  const schoon = email.trim();
  // Deliberately permissive: the confirmation mail is the real check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(schoon) && schoon.length <= 254;
}

/* ------------------------------------------------------------- btw-id */

/** Length per member state, for a cheap shape check before calling VIES. */
const BTW_PATRONEN: Record<string, RegExp> = {
  NL: /^NL[0-9]{9}B[0-9]{2}$/,
  BE: /^BE0[0-9]{9}$/,
  DE: /^DE[0-9]{9}$/,
  FR: /^FR[0-9A-Z]{2}[0-9]{9}$/,
  LU: /^LU[0-9]{8}$/,
  AT: /^ATU[0-9]{8}$/,
};

export function normaliseerBtwId(btwId: string): string {
  return btwId.replace(/[\s.\-]/g, "").toUpperCase();
}

/** Shape check only — never treat this as validation of existence. */
export function btwIdVormKlopt(btwId: string): boolean {
  const schoon = normaliseerBtwId(btwId);
  const land = schoon.slice(0, 2);
  const patroon = BTW_PATRONEN[land];
  // Unknown member state: accept the generic shape and let VIES decide.
  return patroon ? patroon.test(schoon) : /^[A-Z]{2}[0-9A-Z]{6,12}$/.test(schoon);
}

export type ViesResultaat =
  | { status: "geldig"; naam?: string; adres?: string }
  | { status: "ongeldig" }
  | { status: "onbereikbaar" };

/**
 * VIES check (§8). The service is frequently slow or down, and that must
 * never block a sale: an unreachable VIES returns "onbereikbaar", and the
 * caller then charges Dutch btw rather than reverse-charging. Charging btw
 * we might not have needed is recoverable; failing to charge it is not.
 */
export async function controleerVies(
  btwId: string,
  timeoutMs = 4000,
): Promise<ViesResultaat> {
  const schoon = normaliseerBtwId(btwId);
  if (!btwIdVormKlopt(schoon)) return { status: "ongeldig" };

  const land = schoon.slice(0, 2);
  const nummer = schoon.slice(2);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${land}/vat/${nummer}`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (!res.ok) return { status: "onbereikbaar" };

    const body = (await res.json()) as {
      isValid?: boolean;
      name?: string;
      address?: string;
    };
    if (body.isValid === true) {
      return { status: "geldig", naam: body.name, adres: body.address };
    }
    if (body.isValid === false) return { status: "ongeldig" };
    return { status: "onbereikbaar" };
  } catch {
    return { status: "onbereikbaar" };
  } finally {
    clearTimeout(timer);
  }
}
