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
];
