import { PRIJS_EXCL_CENTEN, PRIJS_INCL_CENTEN } from "./pricing";

/**
 * §8 catalogus: de module zelf en een vervangmodule voor een bestaande
 * plaatsing. Prijzen staan excl. btw in eurocenten — de consumentenprijs
 * wordt afgeleid, nooit twee keer opgeslagen.
 *
 * Geen montageset: die bestaat niet. Geen multipack met een eigen prijs
 * meer: grotere aantallen lopen via de staffelkorting hieronder, zodat er
 * één prijs is die overal hetzelfde uitpakt.
 */

export type CatalogusItem = {
  slug: string;
  naam: string;
  omschrijving: string;
  prijsExclBtwCenten: number;
  /** Geadverteerde brutoprijs. Consumentenregels worden hiervandaan geteld. */
  prijsInclBtwCenten?: number;
  btwPercentage: number;
  /** Consumenten mogen het kopen; sommige SKU's zijn alleen zakelijk */
  voorConsument: boolean;
  actief: boolean;
};

export const catalogus: CatalogusItem[] = [
  {
    slug: "blusbox",
    naam: "Blusbox blusmodule",
    omschrijving:
      "Automatische blusmodule voor de meterkast. Activeert zichzelf bij 170 °C, zonder stroom en zonder bediening.",
    prijsExclBtwCenten: PRIJS_EXCL_CENTEN,
    prijsInclBtwCenten: PRIJS_INCL_CENTEN,
    btwPercentage: 21,
    voorConsument: true,
    actief: true,
  },
  {
    slug: "vervangmodule",
    naam: "Vervangmodule",
    omschrijving:
      "Vervanging na tien jaar of na een activering. Zelfde module, bedoeld voor een bestaande plaatsing.",
    prijsExclBtwCenten: PRIJS_EXCL_CENTEN,
    prijsInclBtwCenten: PRIJS_INCL_CENTEN,
    btwPercentage: 21,
    voorConsument: true,
    actief: true,
  },
];

export function vindItem(slug: string): CatalogusItem | undefined {
  return catalogus.find((c) => c.slug === slug);
}

/** Wat een bepaald publiek daadwerkelijk in een mandje mag leggen. */
export function bestelbaar(opts: { zakelijk: boolean }): CatalogusItem[] {
  return catalogus.filter((c) => c.actief && (opts.zakelijk || c.voorConsument));
}

/**
 * Staffelkorting: 5% per dertig stuks, tot maximaal 17,5%.
 *
 * De vierde staffel zou op 20% uitkomen; die wordt afgetopt. Dat is met
 * opzet één regel en geen tabel — een tabel raakt uit de pas met de tekst
 * op /zakelijk, een berekening niet.
 */
export const STAFFEL_PER_AANTAL = 30;
export const STAFFEL_PERCENTAGE = 5;
export const STAFFEL_MAXIMUM = 17.5;

export function staffelPercentage(aantal: number): number {
  if (!Number.isFinite(aantal) || aantal < STAFFEL_PER_AANTAL) return 0;
  const stappen = Math.floor(aantal / STAFFEL_PER_AANTAL);
  return Math.min(stappen * STAFFEL_PERCENTAGE, STAFFEL_MAXIMUM);
}

/** De prijs per stuk na staffelkorting, afgerond op hele centen. */
export function staffelStukprijs(
  aantal: number,
  stukprijsCenten: number,
): number {
  const korting = staffelPercentage(aantal);
  if (korting === 0) return stukprijsCenten;
  return Math.round(stukprijsCenten * (1 - korting / 100));
}

/** De staffels zoals ze op /zakelijk getoond worden. */
export function staffelOverzicht(): { vanaf: number; korting: number }[] {
  const rijen: { vanaf: number; korting: number }[] = [];
  for (let n = STAFFEL_PER_AANTAL; ; n += STAFFEL_PER_AANTAL) {
    const korting = staffelPercentage(n);
    rijen.push({ vanaf: n, korting });
    if (korting >= STAFFEL_MAXIMUM) break;
  }
  return rijen;
}
