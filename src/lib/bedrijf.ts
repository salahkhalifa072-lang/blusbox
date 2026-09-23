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

/**
 * Afzend- en retouradres voor pakketten.
 *
 * Uit de omgeving en niet uit de code, omdat deze repository openbaar is.
 * `bedrijf` hierboven is met opzet adresloos — de eigenaar publiceert zijn
 * vestigingsadres niet — en een adres dat in een publieke repo staat is
 * gepubliceerd, ook al rendert geen enkele pagina het.
 *
 * Ontbreekt er een veld, dan geeft dit null terug in plaats van een half
 * adres. Een verzendlabel met een onvolledige afzender komt niet aan en
 * gaat ook niet retour; dan is hard falen beter dan doorgaan.
 *
 * Zet in Vercel: VERZEND_STRAAT, VERZEND_HUISNUMMER, VERZEND_POSTCODE,
 * VERZEND_PLAATS.
 */
export type Verzendadres = {
  naam: string;
  straat: string;
  huisnummer: string;
  postcode: string;
  plaats: string;
  landcode: string;
  telefoon: string;
  email: string;
};

export function verzendadres(): Verzendadres | null {
  const straat = process.env.VERZEND_STRAAT?.trim();
  const huisnummer = process.env.VERZEND_HUISNUMMER?.trim();
  const postcode = process.env.VERZEND_POSTCODE?.trim();
  const plaats = process.env.VERZEND_PLAATS?.trim();

  if (!straat || !huisnummer || !postcode || !plaats) return null;

  return {
    naam: bedrijf.naam,
    straat,
    huisnummer,
    postcode,
    plaats,
    landcode: "NL",
    telefoon: bedrijf.telefoon,
    email: bedrijf.email,
  };
}
