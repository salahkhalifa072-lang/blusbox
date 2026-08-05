import { isEuLand } from "./btw";

/**
 * §8 dangerous-goods shipping rules.
 *
 * The product carries a dangerous-goods classification even though the
 * route is cleared, so not every destination and not every quantity can be
 * carried. §15 is explicit: checkout may not accept an order it cannot
 * ship. This module is the single place that decides, and it always
 * returns a Dutch explanation rather than a generic error.
 *
 * Shipping itself is free (see lib/pricing) — "can we ship it" and "what
 * does it cost" are separate questions, and only the first one can refuse.
 */

/** Destinations we can currently carry the aerosol modules to. */
export const TOEGESTANE_LANDEN = ["NL"] as const;

/** In voorbereiding — accepted once the carrier contract is signed. */
export const BINNENKORT_LANDEN = ["BE"] as const;

/**
 * Maximum aerosol modules in one consumer shipment.
 * [VERIFY: maximum aantal modules per zending volgens de vervoerder]
 */
export const MAX_MODULES_PER_ZENDING = 10;

export type Bestemming = {
  landcode: string;
  postcode?: string;
};

export type VerzendOordeel =
  | { toegestaan: true; opmerking?: string }
  | { toegestaan: false; reden: string; oplossing?: string };

function normaliseer(landcode: string): string {
  return landcode.trim().toUpperCase();
}

/**
 * Can this many modules go to this destination?
 *
 * Order of checks matters: an unsupported country is reported before a
 * quantity problem, because splitting the order does not help someone in
 * the wrong country.
 */
export function beoordeelVerzending(opts: {
  bestemming: Bestemming;
  aantalModules: number;
}): VerzendOordeel {
  const land = normaliseer(opts.bestemming.landcode);

  if (!land) {
    return {
      toegestaan: false,
      reden: "Er is nog geen land gekozen.",
      oplossing: "Kies een land bij het bezorgadres.",
    };
  }

  // Nothing hazardous in the basket: ordinary parcel rules apply.
  if (opts.aantalModules === 0) {
    return { toegestaan: true };
  }

  if (!(TOEGESTANE_LANDEN as readonly string[]).includes(land)) {
    if ((BINNENKORT_LANDEN as readonly string[]).includes(land)) {
      return {
        toegestaan: false,
        reden:
          "Naar dit land kunnen wij de blusmodule op dit moment nog niet verzenden. De voorbereiding daarvoor loopt.",
        oplossing:
          "Neem contact op, dan laten wij weten zodra verzending naar dit land mogelijk is.",
      };
    }
    if (isEuLand(land)) {
      return {
        toegestaan: false,
        reden:
          "De blusmodule valt onder een classificatie voor gevaarlijke goederen. Naar dit land kunnen wij die nog niet verzenden.",
        oplossing:
          "Zakelijke aanvragen voor dit land nemen wij per geval in behandeling via contact.",
      };
    }
    return {
      toegestaan: false,
      reden:
        "Wij verzenden de blusmodule uitsluitend binnen Nederland. Naar dit land is verzending niet mogelijk.",
    };
  }

  if (opts.aantalModules > MAX_MODULES_PER_ZENDING) {
    return {
      toegestaan: false,
      reden: `Per zending kunnen wij maximaal ${MAX_MODULES_PER_ZENDING} modules vervoeren; deze bestelling bevat er ${opts.aantalModules}.`,
      oplossing:
        "Verlaag het aantal, of vraag een zakelijke levering aan — die verzenden wij in meerdere zendingen.",
    };
  }

  return {
    toegestaan: true,
    opmerking:
      "De zending wordt vervoerd als gevaarlijk goed; de vervoersdocumenten gaan mee in het pakket.",
  };
}

/**
 * The ADR paperwork that must accompany a picking slip (§8). Returns null
 * when nothing hazardous is in the shipment.
 */
export function adrPapieren(opts: {
  aantalModules: number;
  unNummer: string | null;
  adrKlasse: string | null;
}): { unNummer: string; adrKlasse: string; aantal: number } | null {
  if (opts.aantalModules === 0) return null;
  return {
    // Kept nullable until the supplier confirms them; the picking slip
    // shows the placeholder rather than inventing a UN number.
    unNummer: opts.unNummer ?? "[VERIFY: UN-nummer]",
    adrKlasse: opts.adrKlasse ?? "[VERIFY: ADR-klasse]",
    aantal: opts.aantalModules,
  };
}

/** Landen die het afrekenformulier aanbiedt. */
export const LANDKEUZE = [
  { code: "NL", naam: "Nederland" },
  { code: "BE", naam: "België" },
] as const;
