import { isEuLand } from "./btw";

/**
 * §8 verzendregels.
 *
 * De module draagt geen gevaarlijke-goederenclassificatie: geen UN-nummer,
 * geen ADR-klasse. Er gelden dus gewone pakketregels — geen maximum per
 * zending, geen vervoersdocumenten, geen beperking op wat er in één doos
 * mag.
 *
 * Wat blijft is de vraag *waarheen*. Wij bezorgen alleen in Nederland; die
 * grens is er niet vanwege het product maar vanwege de belofte die de site
 * doet (gratis, één werkdag). §15 blijft gelden: het afrekenen mag geen
 * bestelling aannemen die we niet kunnen leveren.
 *
 * Verzending zelf is gratis (zie lib/pricing) — "kunnen we het bezorgen" en
 * "wat kost het" zijn twee vragen, en alleen de eerste kan nee zeggen.
 */

/** Waar wij op dit moment bezorgen. */
export const TOEGESTANE_LANDEN = ["NL"] as const;

/** Levertijd zoals die op de site staat. */
export const LEVERTIJD = "1 werkdag";

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

/** Kan deze bestelling naar deze bestemming? */
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

  // Lege wagen: niets te beoordelen.
  if (opts.aantalModules === 0) {
    return { toegestaan: true };
  }

  if (!(TOEGESTANE_LANDEN as readonly string[]).includes(land)) {
    if (isEuLand(land)) {
      return {
        toegestaan: false,
        reden:
          "Wij bezorgen op dit moment alleen in Nederland. Naar dit land kunnen wij nog niet leveren.",
        oplossing:
          "Zakelijke aanvragen voor levering binnen de EU nemen wij per geval in behandeling via contact.",
      };
    }
    return {
      toegestaan: false,
      reden:
        "Wij bezorgen uitsluitend binnen Nederland. Naar dit land is verzending niet mogelijk.",
    };
  }

  return { toegestaan: true };
}

/** Landen die het afrekenformulier aanbiedt. */
export const LANDKEUZE = [
  { code: "NL", naam: "Nederland" },
  { code: "BE", naam: "België" },
] as const;
