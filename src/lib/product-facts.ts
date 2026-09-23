import type { SpecRow } from "@/components/ui/spec-table";

/**
 * §1 — Confirmed product facts. The only permitted factual spine.
 * Never add a norm, article number, test result or statistic here
 * without client verification.
 */
export const productFacts: SpecRow[] = [
  {
    label: "Functie",
    value:
      "Automatische condensed-aerosol brandonderdrukking voor elektrische behuizingen",
  },
  {
    label: "Activering",
    value: "Thermisch, zelfactiverend bij ±170 °C via detectiekoord",
    isData: true,
  },
  {
    label: "Voeding",
    value: "Geen — geen bedrading, geen elektronica, geen batterij",
  },
  { label: "Blusmiddel", value: "Heet aerosol, oxidator Sr/KNO₃" },
  { label: "Ontwerpdichtheid", value: "100 g/m³", isData: true },
  { label: "Levensduur", value: "10 jaar", isData: true },
  {
    label: "Montage",
    value:
      "Past in de standaard Nederlandse meterkast naast hoofdschakelaar en aardlekschakelaar",
  },
  {
    label: "Residu",
    value: "Niet-geleidend, niet-corrosief voor de omliggende installatie",
  },
  { label: "Gewicht", value: "30 g — 40 g inclusief verpakking", isData: true },
  { label: "Afmetingen", value: "circa 10 × 6 × 4 cm", isData: true },
];

/**
 * De kenmerken die direct onder de productnaam staan.
 *
 * Los van de tabel hierboven en met opzet kort: dit is wat iemand in twee
 * seconden moet kunnen opnemen voordat hij besluit of hij verder leest.
 * Elk punt is een samenvatting van een regel uit `productFacts` — er staat
 * hier dus niets wat niet elders onderbouwd is. Zet er niets bij wat niet
 * in die tabel terug te vinden is.
 */
export const kenmerken = [
  "Zelfactiverend bij 170 °C",
  "Geen stroom of bedrading",
  "10 jaar levensduur",
  "Past op de DIN-rail",
  "Niet-corrosief residu",
] as const;
