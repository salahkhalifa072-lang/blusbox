/**
 * Kortingscodes: de rekenkern en het oordeel.
 *
 * Niets in dit bestand raakt de database of een verzoek aan, zodat elke
 * regel hieronder te testen is zonder iets op te starten. Het ophalen
 * staat in db/korting.ts, het toepassen in lib/winkelwagen.ts.
 *
 * Percentages in basispunten, net als bij het affiliateprogramma: 2000 is
 * 20,00%. Een percentage als kommagetal bewaren is vragen om 19,999999%,
 * en dat soort afwijkingen komen pas boven water op een factuur.
 *
 * De code wordt nergens als geheim behandeld. Hij staat in een mailing of
 * op een folder en wordt doorverteld — dat is precies de bedoeling. De
 * bescherming zit in de geldigheidsregels, niet in geheimhouding.
 */

/** Zoals de code in de database staat en zoals hij vergeleken wordt. */
export type Kortingscode = {
  code: string;
  omschrijving: string | null;
  percentageBp: number;
  actief: boolean;
  geldigTot: Date | null;
  /** null betekent onbeperkt */
  maxGebruik: number | null;
  aantalGebruikt: number;
};

export type KortingOordeel =
  | { geldig: true; code: string; percentageBp: number }
  | { geldig: false; reden: string };

/** Hoogste korting die we accepteren; daarboven is het vrijwel zeker een typefout. */
export const MAX_PERCENTAGE_BP = 5000;

/**
 * Invoer omzetten naar de vorm waarin codes worden opgeslagen.
 *
 * Kleine letters, geen spaties, geen streepjes. Iemand die GLASVEZEL 20
 * overtypt van een folder hoort niet op een foutmelding te stuiten omdat
 * hij een spatie meenam — dat is onze administratie, niet zijn probleem.
 */
export function normaliseerCode(invoer: string): string {
  return invoer
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .slice(0, 40);
}

/**
 * Mag deze code nu gebruikt worden?
 *
 * `null` betekent: niet gevonden. Dat levert dezelfde melding op als een
 * uitgeschakelde code. Onderscheid maken zou een bezoeker laten raden
 * welke codes bestaan, en dat is precies hoe mensen andermans
 * kortingscodes vinden.
 */
export function beoordeelCode(
  rij: Kortingscode | null,
  nu: Date = new Date(),
): KortingOordeel {
  const onbekend = {
    geldig: false as const,
    reden: "Deze kortingscode is niet geldig.",
  };

  if (!rij) return onbekend;
  if (!rij.actief) return onbekend;

  if (rij.geldigTot && rij.geldigTot.getTime() <= nu.getTime()) {
    return { geldig: false, reden: "Deze kortingscode is verlopen." };
  }

  if (rij.maxGebruik !== null && rij.aantalGebruikt >= rij.maxGebruik) {
    return {
      geldig: false,
      reden: "Deze kortingscode is niet meer beschikbaar.",
    };
  }

  // Een code met 0% is geen korting maar wel een belofte aan de klant.
  // Die laten we niet door: beter een nette fout dan een bon waarop
  // "korting: € 0,00" staat.
  if (rij.percentageBp <= 0 || rij.percentageBp > MAX_PERCENTAGE_BP) {
    return { geldig: false, reden: "Deze kortingscode is niet geldig." };
  }

  return { geldig: true, code: rij.code, percentageBp: rij.percentageBp };
}

/**
 * Het kortingsbedrag over een bedrag in centen.
 *
 * Eén keer afronden, op het einde. Per regel afronden en dan optellen
 * loopt bij meerdere stuks uiteen met het bedrag dat de klant op de
 * bevestiging ziet, en dat verschil moet iemand later uitleggen.
 */
export function kortingCenten(bedragCenten: number, percentageBp: number): number {
  if (bedragCenten <= 0 || percentageBp <= 0) return 0;
  return Math.round((bedragCenten * percentageBp) / 10_000);
}

/** Wat er overblijft. Nooit onder nul, ook niet bij een onzinnig percentage. */
export function naKorting(bedragCenten: number, percentageBp: number): number {
  return Math.max(0, bedragCenten - kortingCenten(bedragCenten, percentageBp));
}

/** 2000 → "20%". Hele procenten waar het kan, anders met komma. */
export function toonPercentage(percentageBp: number): string {
  const procent = percentageBp / 100;
  return Number.isInteger(procent)
    ? `${procent}%`
    : `${procent.toString().replace(".", ",")}%`;
}
