import type { Aanspreekvorm, Rol } from "@/db/schema";

/**
 * BTW and reverse-charge maths (§13). All amounts are integer eurocents.
 *
 * Rounding rule: btw is calculated per line on the line total, then
 * rounded half-up once. Rounding per unit and multiplying afterwards
 * drifts by a cent on larger quantities.
 */

export type KoperType = "consument" | "zakelijk_nl" | "zakelijk_eu" | "zakelijk_buiten_eu";

/** EU member states, for the reverse-charge decision. */
export const EU_LANDCODES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
] as const;

export function isEuLand(landcode: string): boolean {
  return (EU_LANDCODES as readonly string[]).includes(landcode.toUpperCase());
}

/** Half-up rounding — Math.round() rounds .5 toward +∞, wrong for negatives. */
export function rondAf(bedrag: number): number {
  return Math.sign(bedrag) * Math.round(Math.abs(bedrag));
}

export function bepaalKoperType(opts: {
  landcode: string;
  isZakelijk: boolean;
  btwIdGevalideerd: boolean;
}): KoperType {
  const land = opts.landcode.toUpperCase();
  if (!opts.isZakelijk) return "consument";
  if (land === "NL") return "zakelijk_nl";
  if (isEuLand(land)) return "zakelijk_eu";
  return "zakelijk_buiten_eu";
}

/**
 * Reverse charge (btw verlegd) applies to intra-EU B2B supplies outside
 * NL, and only with a validated btw-id. Without a valid id we charge
 * Dutch btw — the seller carries the risk otherwise.
 */
export function btwVerlegd(opts: {
  landcode: string;
  isZakelijk: boolean;
  btwIdGevalideerd: boolean;
}): boolean {
  return (
    bepaalKoperType(opts) === "zakelijk_eu" && opts.btwIdGevalideerd === true
  );
}

export type Regel = {
  aantal: number;
  stukprijsExclBtwCenten: number;
  btwPercentage: number;
};

export type OrderTotalen = {
  subtotaalExclBtwCenten: number;
  btwBedragCenten: number;
  verzendkostenCenten: number;
  totaalInclBtwCenten: number;
  btwVerlegd: boolean;
};

export function berekenTotalen(
  regels: Regel[],
  opts: {
    landcode: string;
    isZakelijk: boolean;
    btwIdGevalideerd: boolean;
    /** Always 0 today — free shipping — but modelled so it can change. */
    verzendkostenCenten?: number;
  },
): OrderTotalen {
  const verlegd = btwVerlegd(opts);
  const verzendkostenCenten = opts.verzendkostenCenten ?? 0;

  let subtotaal = 0;
  let btw = 0;

  for (const regel of regels) {
    const regelTotaal = regel.aantal * regel.stukprijsExclBtwCenten;
    subtotaal += regelTotaal;
    if (!verlegd) {
      btw += rondAf((regelTotaal * regel.btwPercentage) / 100);
    }
  }

  return {
    subtotaalExclBtwCenten: subtotaal,
    btwBedragCenten: btw,
    verzendkostenCenten,
    totaalInclBtwCenten: subtotaal + btw + verzendkostenCenten,
    btwVerlegd: verlegd,
  };
}

/** Consumer price incl. btw from a stored excl.-btw price. */
export function inclBtw(exclCenten: number, btwPercentage = 21): number {
  return exclCenten + rondAf((exclCenten * btwPercentage) / 100);
}

/** Inverse of inclBtw, for deriving a stored excl. price from a gross one. */
export function exclBtw(inclCenten: number, btwPercentage = 21): number {
  return rondAf(inclCenten / (1 + btwPercentage / 100));
}

/**
 * §8: consumers see incl. btw, business accounts see excl. — never both
 * in one view. This decides which of the two a given account gets.
 */
export function prijsWeergave(rol: Rol): {
  toon: "incl" | "excl";
  toelichting: string;
} {
  const zakelijk = rol === "installateur" || rol === "admin" || rol === "operations";
  return zakelijk
    ? { toon: "excl", toelichting: "excl. btw" }
    : { toon: "incl", toelichting: "incl. btw" };
}

/** §2 tone token — one place, so copy is never duplicated per audience. */
export function aanhef(vorm: Aanspreekvorm): { jeU: string; jouwUw: string } {
  return vorm === "u"
    ? { jeU: "u", jouwUw: "uw" }
    : { jeU: "je", jouwUw: "je" };
}
