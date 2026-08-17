/**
 * Bedrijfsgegevens, op één plek.
 *
 * Deze staan wettelijk verplicht in de footer, op /contact, in de algemene
 * voorwaarden en op het modelformulier voor herroeping (art. 6:230m BW en
 * de Dienstenwet). Ze op vijf plekken overtypen is precies hoe ze uit de
 * pas gaan lopen zodra er één verandert.
 *
 * Bewust geen vestigingsadres: de klant wil dat niet publiceren. Dat mag,
 * zolang er een werkende manier is om contact op te nemen en het adres bij
 * een herroeping wél bekend wordt — daarom staat het retouradres in de
 * bevestiging die iemand krijgt nadat hij zijn retour aanmeldt.
 */
export const bedrijf = {
  /** Handelsnaam zoals de klant hem voert */
  naam: "Blusbox.nl",
  /** Volledige aanduiding voor juridische teksten */
  volledig: "Blusbox.nl, een merk van ZWT",
  moederbedrijf: "ZWT",
  kvk: "86275437",
  btwId: "NL004221476B40",
  telefoon: "+31 6 49083671",
  /** Zonder spaties, voor tel:-links */
  telefoonLink: "+31649083671",
  email: "info@blusbox.nl",
} as const;

/** Eén regel voor de footer. */
export const bedrijfsregel = `${bedrijf.volledig} · KvK ${bedrijf.kvk} · Btw-id ${bedrijf.btwId}`;
