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

/**
 * Splits a gross amount into net and btw, exactly.
 *
 * btw is the remainder after rounding the net down from the gross, never
 * `round(net * tarief)`. That matters: an advertised price of € 28,95
 * cannot be produced by adding rounded btw to any whole-cent net amount —
 * the results jump from 28,94 to 28,96. Deriving btw by subtraction makes
 * every advertised price exactly representable, which is what a consumer
 * shop needs, and it is how a Dutch consumer invoice is drawn up.
 */
export function splitsIncl(
  inclCenten: number,
  btwPercentage = 21,
): { exclCenten: number; btwCenten: number } {
  const excl = rondAf(inclCenten / (1 + btwPercentage / 100));
  return { exclCenten: excl, btwCenten: inclCenten - excl };
}

export type Regel = {
  aantal: number;
  stukprijsExclBtwCenten: number;
  btwPercentage: number;
  /**
   * The advertised gross unit price. When present and btw is actually
   * charged, the line is calculated from this so the customer pays the
   * price on the page to the cent. Business buyers are billed from the
   * net price instead, which is what their invoice is based on.
   */
  stukprijsInclBtwCenten?: number;
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
    if (!verlegd && regel.stukprijsInclBtwCenten !== undefined) {
      // Consumer line: the advertised gross price is the truth, so work
      // down from it. Adding rounded btw to a net price cannot reproduce
      // every advertised amount and would charge a cent too much or too
      // little (see splitsIncl).
      const regelIncl = regel.aantal * regel.stukprijsInclBtwCenten;
      const { exclCenten, btwCenten } = splitsIncl(
        regelIncl,
        regel.btwPercentage,
      );
      subtotaal += exclCenten;
      btw += btwCenten;
      continue;
    }

    // Business line, or btw reverse-charged: the net price is the base.
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
