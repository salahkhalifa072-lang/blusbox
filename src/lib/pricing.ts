/**
 * Single source of truth for price and shipping.
 * Consumer prices are shown incl. btw, business prices excl. (§8).
 */

export const BTW_TARIEF = 0.21;

/** Consumer price incl. btw, in euro cents to avoid float drift. */
export const PRIJS_INCL_CENTEN = 2895;

/** What shipping would have cost. Never charged — used to show the saving. */
export const VERZENDWAARDE_CENTEN = 600;

/**
 * Derived, not stored separately: the advertised gross price is the
 * canonical one. btw follows by subtraction, so € 28,95 is exactly
 * representable — adding rounded btw to a net price cannot produce it.
 */
export const PRIJS_EXCL_CENTEN = Math.round(
  PRIJS_INCL_CENTEN / (1 + BTW_TARIEF),
);

/** The btw actually charged on one module, by subtraction. */
export const PRIJS_BTW_CENTEN = PRIJS_INCL_CENTEN - PRIJS_EXCL_CENTEN;

/** nl-NL money: comma decimal, non-breaking space after the sign. */
export function euro(centen: number): string {
  return `€ ${(centen / 100).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const prijsIncl = euro(PRIJS_INCL_CENTEN);
export const prijsExcl = euro(PRIJS_EXCL_CENTEN);
export const verzendwaarde = euro(VERZENDWAARDE_CENTEN);

/**
 * Shipping is free on every order, to every destination we can ship to.
 * There is no threshold — so never phrase it as "vanaf € x".
 */
export const gratisVerzending = {
  kort: "Altijd gratis verzending",
  metWaarde: `Altijd gratis verzending — t.w.v. ${verzendwaarde}`,
  uitleg: `Bij elke bestelling, zonder minimumbedrag. Wij rekenen nooit ${verzendwaarde} verzendkosten door.`,
} as const;
