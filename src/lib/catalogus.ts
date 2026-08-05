import { PRIJS_EXCL_CENTEN } from "./pricing";

/**
 * §8 catalogue: hero SKU plus montageset, vervangmodule and an installer
 * multipack. Prices are excl. btw in eurocents — the consumer price is
 * derived, never stored twice.
 *
 * Anything containing the aerosol charge carries the dangerous-goods
 * classification; the montageset does not, which is why the flag lives per
 * product rather than per order.
 */

export type CatalogusItem = {
  slug: string;
  naam: string;
  omschrijving: string;
  prijsExclBtwCenten: number;
  btwPercentage: number;
  gevaarlijkeGoederen: boolean;
  unNummer: string | null;
  adrKlasse: string | null;
  /** How many aerosol modules this SKU puts in a shipment */
  modulesPerStuk: number;
  /** Consumers may buy it; some SKUs are dealer-only */
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
    btwPercentage: 21,
    gevaarlijkeGoederen: true,
    // [VERIFY: UN-nummer en ADR-klasse bevestigen met de leverancier]
    unNummer: null,
    adrKlasse: null,
    modulesPerStuk: 1,
    voorConsument: true,
    actief: true,
  },
  {
    slug: "montageset",
    naam: "Montageset",
    omschrijving:
      "Bevestigingsmateriaal en kabelbinders voor het net leggen van het detectiekoord.",
    // [VERIFY: verkoopprijs montageset]
    prijsExclBtwCenten: 0,
    btwPercentage: 21,
    gevaarlijkeGoederen: false,
    unNummer: null,
    adrKlasse: null,
    modulesPerStuk: 0,
    voorConsument: true,
    actief: false,
  },
  {
    slug: "vervangmodule",
    naam: "Vervangmodule",
    omschrijving:
      "Vervanging na tien jaar of na een activering. Zelfde module, bedoeld voor een bestaande plaatsing.",
    prijsExclBtwCenten: PRIJS_EXCL_CENTEN,
    btwPercentage: 21,
    gevaarlijkeGoederen: true,
    unNummer: null,
    adrKlasse: null,
    modulesPerStuk: 1,
    voorConsument: true,
    actief: true,
  },
  {
    slug: "installateur-multipack",
    naam: "Installateur-multipack (10 stuks)",
    omschrijving:
      "Doos met tien modules voor installatiebedrijven. Lotnummers worden per doos meegeleverd.",
    // [VERIFY: staffelprijs multipack]
    prijsExclBtwCenten: PRIJS_EXCL_CENTEN * 10,
    btwPercentage: 21,
    gevaarlijkeGoederen: true,
    unNummer: null,
    adrKlasse: null,
    modulesPerStuk: 10,
    voorConsument: false,
    actief: true,
  },
];

export function vindItem(slug: string): CatalogusItem | undefined {
  return catalogus.find((c) => c.slug === slug);
}

/** What a given audience may actually put in a basket. */
export function bestelbaar(opts: { zakelijk: boolean }): CatalogusItem[] {
  return catalogus.filter(
    (c) => c.actief && (opts.zakelijk || c.voorConsument),
  );
}
