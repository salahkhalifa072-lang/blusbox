/**
 * Beoordelingen van klanten.
 *
 * Verzonnen reviews zijn in de EU verboden — punt 23b en 23c van bijlage I
 * bij de richtlijn oneerlijke handelspraktijken, in Nederland art. 6:193g
 * BW — en de ACM beboet het. Het gaat daarbij niet om de náám: een
 * voornaam met initiaal is normaal en mag. Het gaat om de bewering dat
 * iemand het product gekocht en beoordeeld heeft. Die moet waar zijn.
 *
 * Vul hier dus op wat klanten werkelijk gezegd hebben. Zolang deze lijst
 * leeg is toont de site geen reviewblok. Dat is beter dan een leeg kader,
 * en veel beter dan een gevuld kader dat niet klopt.
 *
 * Over de media: welke foto bij welke klant hoort is door de eigenaar
 * doorgegeven, niet door mij afgeleid. In de bestanden zit geen naam en de
 * EXIF-gegevens geven alleen datum en toestel. Sta niet toe dat er hier
 * ooit een foto onder een naam belandt op gevoel — dan is het weer een
 * verzinsel, alleen in beeldvorm.
 *
 * Eén opname per beoordeling.
 *
 * De teksten staan er zoals ze zijn aangeleverd. Alleen een hoofdletter,
 * een punt en één doorgeslagen letter zijn rechtgezet ("klinkt" → "klikt",
 * anders leest die zin als onzin). Verder niets gladgestreken: een
 * beoordeling die klinkt als reclametekst gelooft niemand, en juist de
 * eigen formulering maakt hem echt.
 *
 * Wat bij het klaarmaken is weggehaald: op een van de foto's stond een
 * sticker met straatnaam en postcode van het installatiebedrijf. Die is
 * eruit gesneden vóór publicatie. Controleer dat opnieuw bij elke foto die
 * hierna wordt toegevoegd — een meterkast hangt bij iemand thuis, en daar
 * hangen vaker papieren met gegevens naast.
 */

export type ReviewMedia =
  | { soort: "foto"; src: string; alt: string }
  | { soort: "video"; src: string; poster: string; alt: string };

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
  /** Beeld dat déze klant heeft aangeleverd. */
  media?: ReviewMedia[];
};

export const REVIEWS: Review[] = [
  {
    naam: "Sophie de Vries",
    sterren: 5,
    kop: "Compact en overzichtelijk",
    tekst:
      "De Blusbox is compact, overzichtelijk en heel eenvoudig te gebruiken. Het geeft een veilig gevoel om deze in huis te hebben.",
    media: [
      {
        soort: "video",
        src: "/media/klant/installatie.mp4",
        poster: "/media/klant/installatie.jpg",
        alt: "Opname van een installatie: de module wordt op de DIN-rail geklikt, het detectiekoord wordt langs de groepen gelegd en de kast gaat dicht",
      },
    ],
  },
  {
    naam: "Thomas Jansen",
    sterren: 5,
    kop: "Snelle levering, duidelijke uitleg",
    tekst:
      "Snelle levering en een duidelijke uitleg bij het product. Alles wat je nodig hebt zit netjes bij elkaar. Zeker een aanrader!",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-2.webp",
        alt: "Blusbox-module op de rail, direct boven een Eaton aardlekautomaat",
      },
    ],
  },
  {
    naam: "Nadia El Amrani",
    sterren: 5,
    kop: "Mooi en praktisch ontworpen",
    tekst:
      "Mooi en praktisch ontworpen. De Blusbox neemt weinig ruimte in en is direct klaar voor gebruik wanneer dat nodig is.",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-1.webp",
        alt: "Meterkast met Blusbox tussen de installatieautomaten, naast een waarschuwingssticker voor zonnepanelen",
      },
    ],
  },
  {
    naam: "Daan Vermeer",
    sterren: 5,
    kop: "Goede prijs-kwaliteitverhouding",
    tekst:
      "Uitstekende kwaliteit en een goede prijs-kwaliteitverhouding. De klantenservice reageerde bovendien snel en vriendelijk op mijn vraag.",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-6.webp",
        alt: "Attema-kast met Blusbox onder de aardlekschakelaar die de blauwe groepen beveiligt",
      },
    ],
  },
  {
    naam: "Lisa van den Berg",
    sterren: 5,
    kop: "Compleet en gebruiksvriendelijk",
    tekst:
      "Erg tevreden met mijn aankoop. De Blusbox is compleet, gebruiksvriendelijk en zorgt voor extra veiligheid in huis.",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-7.webp",
        alt: "Schneider-groepenkast met Blusbox op de rail naast de hoofdschakelaar",
      },
    ],
  },
  {
    naam: "Maarten de Vries",
    sterren: 5,
    kop: "Better safe than sorry",
    tekst: "Top product en snel geleverd, better safe than sorry!",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-3.webp",
        alt: "Holec-groepenkast met Blusbox, met de groepenverklaring ernaast op de wand",
      },
    ],
  },
  {
    naam: "Lisanne",
    // Vier sterren: deze tekst zegt waaróm ze hem kocht, niet dat het
    // product uitblinkt. Er als vijfde ster bij zetten wat er niet staat
    // is precies hoe een reviewblok ongeloofwaardig wordt.
    sterren: 4,
    kop: "Na het NOS-bericht meteen besteld",
    tekst:
      "Mijn meterkast zat vol spullen en na het artikel van NOS over branden in meterkast direct zo een blusbox aangeschaft.",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-4.webp",
        alt: "Houten meterkast met slimme meter, met de Blusbox onderaan de groepenkast",
      },
    ],
  },
  {
    naam: "Jaydon Z.",
    sterren: 5,
    kop: "Zo tussen de schakelaars geklikt",
    tekst:
      "Snelle levering en makkelijk geplaatst, je klikt gewoon je meterkast open en plaatst hem tussen een schakelaar.",
    media: [
      {
        soort: "foto",
        src: "/media/klant/installatie-5.webp",
        alt: "Hager-groepenkast met Blusbox naast de groepen voor warmtepomp en schuur",
      },
    ],
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
