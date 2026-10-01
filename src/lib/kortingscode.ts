import { createHash } from "node:crypto";

/**
 * Kortingscodes bij het afrekenen.
 *
 * De codes staan hier alleen als SHA-256-vingerafdruk. Deze repository is
 * openbaar; een code die er leesbaar in staat, staat binnen een week op
 * een couponsite. Een vingerafdruk is niet terug te rekenen naar de code,
 * maar wel te vergelijken met wat een klant intypt.
 *
 * Een code toevoegen: `node -e 'console.log(require("crypto").createHash("sha256").update("jouwcode").digest("hex"))'`
 * met de code in kleine letters, en de uitkomst hieronder erbij zetten.
 *
 * Bewust niet stapelbaar en zonder minimumbedrag: één code per bestelling,
 * een vast percentage over alle artikelen.
 */

export type Kortingscode = {
  /** Zoals de klant hem ziet, in hoofdletters */
  code: string;
  /** Hele procenten */
  percentage: number;
};

const CODES: Record<string, number> = {
  // glasvezel20 — 20% op de hele bestelling (oktober 2026)
  "33be64cff6bd542345156f5512d390d26ee861147b1e8aa5192204b9738c4bb4": 20,
};

/** Spaties en hoofdletters doen er niet toe; "Glasvezel 20" werkt ook. */
export function normaliseerCode(invoer: string): string {
  return invoer.replace(/\s+/g, "").toLowerCase();
}

export function zoekKortingscode(invoer: string | undefined | null): Kortingscode | null {
  if (!invoer) return null;
  const schoon = normaliseerCode(invoer);
  // Begrensd: een cookie of formulierveld van een megabyte hoeft niet
  // gehasht te worden om te weten dat het geen code is.
  if (!schoon || schoon.length > 40) return null;
  const hash = createHash("sha256").update(schoon).digest("hex");
  const percentage = CODES[hash];
  return percentage ? { code: schoon.toUpperCase(), percentage } : null;
}

/**
 * Stukprijs na korting, afgerond op hele centen. Per stuk en niet over het
 * regeltotaal: Stripe en de orderregels rekenen met een stukprijs, en die
 * moeten op de cent gelijk zijn aan wat de klant op het scherm zag.
 */
export function naKorting(stukprijsCenten: number, percentage: number): number {
  return Math.round((stukprijsCenten * (100 - percentage)) / 100);
}
