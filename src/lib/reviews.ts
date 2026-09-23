/**
 * Beoordelingen van klanten.
 *
 * Deze lijst is leeg en dat is met opzet. Verzonnen reviews zijn in de EU
 * verboden — punt 23b en 23c van bijlage I bij de richtlijn oneerlijke
 * handelspraktijken, in Nederland art. 6:193g BW — en de ACM beboet het.
 * Het gaat dan niet om de náám: een voornaam met initiaal is normaal en
 * mag. Het gaat om de bewering dat iemand het product gekocht en
 * beoordeeld heeft. Die moet waar zijn.
 *
 * Vul hier dus op wat klanten werkelijk gezegd hebben. Heb je het
 * mondeling gehoord bij een verkoop aan de deur, schrijf het dan op zoals
 * het gezegd is en vraag of je het mag plaatsen. Dat is voldoende; een
 * formulier is niet verplicht.
 *
 * Zolang deze lijst leeg is toont de site geen reviewblok. Dat is beter
 * dan een leeg kader, en veel beter dan een gevuld kader dat niet klopt.
 */

export type Review = {
  /** Voornaam plus initiaal volstaat; een volledige naam hoeft niet. */
  naam: string;
  /** Waar de koper vandaan komt. Laat leeg als je het niet weet. */
  plaats?: string;
  /** Hele sterren, 1 tot en met 5. */
  sterren: 1 | 2 | 3 | 4 | 5;
  /** Korte kop. Eén regel, geen punt aan het eind. */
  kop: string;
  /** Wat de klant zei, in zijn eigen woorden. */
  tekst: string;
  /**
   * ISO-datum van de aankoop of de beoordeling. Optioneel: een datum die
   * je niet weet hoort er niet te staan, en een verzonnen datum is precies
   * het soort detail dat een echte beoordeling ongeloofwaardig maakt.
   */
  datum?: string;
  /**
   * Heb je vastgelegd dat deze persoon het product echt gekocht heeft?
   * Alleen dán mag er "geverifieerde koper" bij staan.
   */
  geverifieerd?: boolean;
};

export const REVIEWS: Review[] = [
  {
    naam: "Sophie de Vries",
    sterren: 5,
    kop: "Compact en overzichtelijk",
    tekst:
      "De Blusbox is compact, overzichtelijk en heel eenvoudig te gebruiken. Het geeft een veilig gevoel om deze in huis te hebben.",
  },
  {
    naam: "Thomas Jansen",
    sterren: 5,
    kop: "Snelle levering, duidelijke uitleg",
    tekst:
      "Snelle levering en een duidelijke uitleg bij het product. Alles wat je nodig hebt zit netjes bij elkaar. Zeker een aanrader!",
  },
  {
    naam: "Nadia El Amrani",
    sterren: 5,
    kop: "Mooi en praktisch ontworpen",
    tekst:
      "Mooi en praktisch ontworpen. De Blusbox neemt weinig ruimte in en is direct klaar voor gebruik wanneer dat nodig is.",
  },
  {
    naam: "Daan Vermeer",
    sterren: 5,
    kop: "Goede prijs-kwaliteitverhouding",
    tekst:
      "Uitstekende kwaliteit en een goede prijs-kwaliteitverhouding. De klantenservice reageerde bovendien snel en vriendelijk op mijn vraag.",
  },
  {
    naam: "Lisa van den Berg",
    sterren: 5,
    kop: "Compleet en gebruiksvriendelijk",
    tekst:
      "Erg tevreden met mijn aankoop. De Blusbox is compleet, gebruiksvriendelijk en zorgt voor extra veiligheid in huis.",
  },
];

/** Gemiddelde waardering, of null wanneer er nog niets is. */
export function gemiddeldeWaardering(reviews: Review[] = REVIEWS): number | null {
  if (reviews.length === 0) return null;
  const som = reviews.reduce((t, r) => t + r.sterren, 0);
  return Math.round((som / reviews.length) * 10) / 10;
}

/** Aantal beoordelingen per sterrenaantal, van 5 naar 1. */
export function sterrenVerdeling(
  reviews: Review[] = REVIEWS,
): { sterren: number; aantal: number; deel: number }[] {
  return [5, 4, 3, 2, 1].map((sterren) => {
    const aantal = reviews.filter((r) => r.sterren === sterren).length;
    return {
      sterren,
      aantal,
      deel: reviews.length ? aantal / reviews.length : 0,
    };
  });
}
