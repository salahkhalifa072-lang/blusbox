/**
 * Kennisbank: artikelen die elk één zoekvraag beantwoorden.
 *
 * Bewust als data en niet als losse pagina's: één template zorgt dat elk
 * artikel dezelfde opbouw, gestructureerde gegevens en doorverwijzing naar
 * de productpagina krijgt, en een nieuw artikel is een blok tekst erbij.
 *
 * Regel voor deze teksten (zie de brief): geen verzonnen cijfers, normen
 * of statistieken. Algemene veiligheidsadviezen en wat er over Blusbox al
 * op de productpagina staat — meer niet. Een cijfer erbij kan pas met een
 * bron die we kunnen tonen.
 */

export type Blok =
  | { soort: "p"; tekst: string }
  | { soort: "h2"; tekst: string }
  | { soort: "lijst"; items: string[] }
  | { soort: "let-op"; tekst: string };

export type Artikel = {
  slug: string;
  /** Wat in Google staat: de vraag zoals mensen hem typen. */
  titel: string;
  /** Korte kop op de pagina zelf. */
  kop: string;
  omschrijving: string;
  intro: string;
  gepubliceerd: string;
  bijgewerkt: string;
  leestijd: number;
  inhoud: Blok[];
};

export const ARTIKELEN: Artikel[] = [
  {
    slug: "meterkast-wordt-warm",
    titel: "Meterkast wordt warm of ruikt verbrand: wat moet je doen?",
    kop: "Meterkast warm of brandlucht",
    omschrijving:
      "Een warme meterkast, brandlucht, zoemen of verkleurde onderdelen: wat de signalen betekenen, wat je direct doet en wanneer je een installateur belt.",
    intro:
      "Een meterkast hoort niet warm te worden en niet te ruiken. Merk je dat wel, dan is er meestal één punt in de kast dat te warm wordt. Zo herken je het en zo handel je.",
    gepubliceerd: "2026-10-16",
    bijgewerkt: "2026-10-16",
    leestijd: 4,
    inhoud: [
      { soort: "h2", tekst: "Signalen die je serieus moet nemen" },
      {
        soort: "lijst",
        items: [
          "De deur of de kast voelt warm aan, terwijl het in huis niet warm is.",
          "Een scherpe geur van verbrand plastic of geschroeide isolatie.",
          "Zoemen, knetteren of tikken uit de groepenkast.",
          "Verkleurde of gesmolten plekken op een schakelaar, klem of kabel.",
          "Een groep of aardlekschakelaar die zonder duidelijke reden steeds uitvalt.",
        ],
      },
      {
        soort: "p",
        tekst:
          "Elk van deze signalen kan wijzen op een losse verbinding of een overbelaste groep. Een slechte verbinding heeft een hogere overgangsweerstand, en daar ontstaat warmte. Dat proces gaat langzaam en stil — precies daarom wordt het vaak pas opgemerkt als er al schade is.",
      },
      { soort: "h2", tekst: "Wat je direct doet" },
      {
        soort: "let-op",
        tekst:
          "Zie je rook of vlammen? Ga niet zelf aan de kast zitten. Haal iedereen naar buiten, sluit de deuren achter je en bel 112.",
      },
      {
        soort: "lijst",
        items: [
          "Geen rook of vuur, wel warmte of brandlucht: zet als het veilig kan de hoofdschakelaar uit, zodat er geen stroom meer door de kast gaat.",
          "Raak geen verkleurde of hete onderdelen aan en haal geen afdekplaten weg.",
          "Laat de kast dicht staan en zet er niets tegenaan.",
          "Bel een erkend installateur en beschrijf wat je ziet, ruikt of hoort.",
          "Zet de stroom pas weer aan als een installateur de kast heeft bekeken.",
        ],
      },
      { soort: "h2", tekst: "Hoe je het voorkomt" },
      {
        soort: "p",
        tekst:
          "Laat een oudere installatie periodiek controleren, zeker als je er grote verbruikers bij hebt gekregen zoals een inductiekookplaat, een laadpaal of een warmtepomp. Zet geen spullen in of tegen de meterkast, zodat warmte weg kan en je problemen ziet.",
      },
      {
        soort: "p",
        tekst:
          "Een rookmelder in de gang waarschuwt je als er rook is. Een automatische blusmodule zoals Blusbox in de meterkast zelf grijpt in als het daar te heet wordt — ook als er niemand thuis is.",
      },
    ],
  },
  {
    slug: "welke-brandblusser-meterkast",
    titel: "Welke brandblusser past bij de meterkast? Poeder, CO₂, schuim of automatisch",
    kop: "Welke brandblusser voor de meterkast?",
    omschrijving:
      "Poeder, CO₂, schuim, blusdeken of een automatische blusmodule: wat je wel en niet gebruikt bij brand in de meterkast, en waarom.",
    intro:
      "Bij brand in de meterkast heb je te maken met elektriciteit, een kleine afgesloten ruimte en dure apparatuur. Niet elk blusmiddel is daar geschikt voor. Een overzicht.",
    gepubliceerd: "2026-10-16",
    bijgewerkt: "2026-10-16",
    leestijd: 5,
    inhoud: [
      { soort: "h2", tekst: "Eerst: water nooit" },
      {
        soort: "p",
        tekst:
          "Water geleidt stroom. Gebruik nooit water op een installatie die onder spanning kan staan.",
      },
      { soort: "h2", tekst: "De gangbare blusmiddelen naast elkaar" },
      {
        soort: "lijst",
        items: [
          "CO₂-blusser: laat geen residu achter en is bedoeld voor elektrische installaties. Het gas verdringt zuurstof; gebruik hem kort en ventileer daarna.",
          "Poederblusser: blust snel, maar het fijne poeder verspreidt zich door de hele ruimte en is lastig uit een installatie te krijgen.",
          "Schuimblusser: kijk op het etiket of hij geschikt en getest is voor gebruik bij elektrische apparatuur, en houd de afstand aan die erop staat.",
          "Blusdeken: bedoeld voor een pannenbrand of brandende kleding, niet voor een groepenkast.",
        ],
      },
      {
        soort: "let-op",
        tekst:
          "Een handblusser werkt alleen als iemand thuis is, de brand ziet en er veilig bij kan. Bij twijfel: naar buiten en 112 bellen.",
      },
      { soort: "h2", tekst: "Automatisch blussen in de kast zelf" },
      {
        soort: "p",
        tekst:
          "Een meterkastbrand begint vaak als niemand kijkt: 's nachts of als je weg bent. Daarom bestaan er automatische blusmodules die in de kast zelf hangen. Blusbox klikt op de DIN-rail naast je groepen, heeft geen stroom nodig en activeert vanzelf bij 170 °C. Het blusmiddel is condensed aerosol; het residu is niet-geleidend en niet-corrosief.",
      },
      {
        soort: "p",
        tekst:
          "Een automatische module vervangt geen rookmelder en geen handblusser elders in huis. Het is een extra laag op de plek waar je zelf het minst snel bij bent.",
      },
    ],
  },
  {
    slug: "rookmelder-verplicht",
    titel: "Rookmelder verplicht: waar moet hij hangen en waar let je op?",
    kop: "Rookmelders verplicht",
    omschrijving:
      "Sinds 1 juli 2022 is een rookmelder verplicht op elke woonverdieping. Waar hij moet hangen, waar je op let bij het kopen en hoe je hem onderhoudt.",
    intro:
      "Sinds 1 juli 2022 moet elke woning in Nederland op iedere verdieping met een woon- of slaapruimte een rookmelder hebben. Wat dat in de praktijk betekent.",
    gepubliceerd: "2026-10-16",
    bijgewerkt: "2026-10-16",
    leestijd: 4,
    inhoud: [
      { soort: "h2", tekst: "Waar hij moet hangen" },
      {
        soort: "p",
        tekst:
          "Op elke verdieping met een woon- of slaapruimte, op de route die je bij brand neemt om naar buiten te gaan — meestal de overloop of de gang. Hang hem aan het plafond, niet te dicht in een hoek.",
      },
      { soort: "h2", tekst: "Waar je op let bij het kopen" },
      {
        soort: "lijst",
        items: [
          "Kies een rookmelder die voldoet aan de Europese norm EN 14604; dat staat op de verpakking.",
          "Een melder met een vaste batterij voor de hele levensduur scheelt het vervangen van losse batterijen.",
          "Gekoppelde melders gaan allemaal af als er één rook ziet, handig in een huis met meerdere verdiepingen.",
        ],
      },
      { soort: "h2", tekst: "Onderhoud" },
      {
        soort: "p",
        tekst:
          "Druk regelmatig op de testknop en houd de melder stofvrij. Rookmelders hebben een beperkte levensduur; de vervangdatum staat op de melder of in de handleiding.",
      },
      { soort: "h2", tekst: "En de meterkast?" },
      {
        soort: "p",
        tekst:
          "Een rookmelder waarschuwt je, maar blust niet. In de meterkast zelf kan een automatische blusmodule zoals Blusbox een beginnende brand doven voordat hij zich uitbreidt. Bij Blusbox kun je bij het afrekenen meteen een rookmelder (EN 14604) meebestellen.",
      },
    ],
  },
  {
    slug: "brandblusser-verplicht-thuis",
    titel: "Is een brandblusser thuis verplicht? Wat de regels zeggen",
    kop: "Brandblusser thuis verplicht?",
    omschrijving:
      "Moet je thuis een brandblusser hebben? Wat er voor woningen verplicht is, wat niet, en welke blusmiddelen wel verstandig zijn.",
    intro:
      "Voor een gewone woning is de rookmelder het verplichte onderdeel. Een brandblusser is thuis geen wettelijke plicht, maar wel een verstandige aanvulling. Zo zit het.",
    gepubliceerd: "2026-10-16",
    bijgewerkt: "2026-10-16",
    leestijd: 3,
    inhoud: [
      { soort: "h2", tekst: "Wat verplicht is" },
      {
        soort: "p",
        tekst:
          "Voor woningen geldt sinds 1 juli 2022 de plicht om op elke woonverdieping een rookmelder te hebben. Een brandblusser of blusdeken is voor een gewone woning niet verplicht.",
      },
      {
        soort: "p",
        tekst:
          "Voor bedrijven, verhuur en gebouwen met meerdere woningen kunnen andere eisen gelden, bijvoorbeeld uit de omgevingsvergunning of de verzekering. Vraag dat na bij je gemeente, verhuurder of verzekeraar.",
      },
      { soort: "h2", tekst: "Wat wel verstandig is" },
      {
        soort: "lijst",
        items: [
          "Een blusdeken in de keuken, voor een pannenbrand.",
          "Een handblusser die geschikt is voor elektrische apparatuur, op een plek die je snel kunt pakken.",
          "In de meterkast een automatische oplossing, omdat een brand daar vaak begint als niemand het ziet.",
        ],
      },
      {
        soort: "p",
        tekst:
          "Blusbox is zo'n automatische oplossing: een module op de DIN-rail die zonder stroom en zonder bediening ingrijpt bij 170 °C. Hij vervangt geen rookmelder, maar vult hem aan op de plek waar je zelf niet bij bent.",
      },
    ],
  },
  {
    slug: "blusdeken-of-brandblusser",
    titel: "Blusdeken of brandblusser: wat gebruik je wanneer?",
    kop: "Blusdeken of brandblusser?",
    omschrijving:
      "Een blusdeken en een brandblusser hebben elk hun eigen toepassing. Wanneer je welke pakt, en waarom geen van beide in de meterkast thuishoort.",
    intro:
      "Een blusdeken en een brandblusser vullen elkaar aan. Welke je pakt, hangt af van wat er brandt en hoe groot de brand is.",
    gepubliceerd: "2026-10-16",
    bijgewerkt: "2026-10-16",
    leestijd: 3,
    inhoud: [
      { soort: "h2", tekst: "De blusdeken" },
      {
        soort: "p",
        tekst:
          "Een blusdeken legt een brand letterlijk het zwijgen op door de zuurstof af te sluiten. Hij is bedoeld voor kleine branden die je kunt afdekken: een brandende pan of brandende kleding. Hang hem in de keuken, niet direct boven het fornuis.",
      },
      { soort: "h2", tekst: "De brandblusser" },
      {
        soort: "p",
        tekst:
          "Een brandblusser bereikt een brand op afstand en werkt ook bij iets wat je niet kunt afdekken. Kijk op het etiket voor welke soorten brand hij geschikt is en of hij bij elektrische apparatuur gebruikt mag worden.",
      },
      {
        soort: "let-op",
        tekst:
          "Nooit water op een pannenbrand: het brandende vet spat in één keer uit. Deksel of blusdeken erop en het vuur uitzetten.",
      },
      { soort: "h2", tekst: "En de meterkast?" },
      {
        soort: "p",
        tekst:
          "Een blusdeken past niet over een groepenkast, en met een handblusser moet je er eerst bij kunnen. Daarom bestaat er een automatische blusmodule voor in de kast zelf. Blusbox activeert bij 170 °C, zonder stroom en zonder dat iemand thuis hoeft te zijn.",
      },
    ],
  },
];

export function vindArtikel(slug: string): Artikel | undefined {
  return ARTIKELEN.find((a) => a.slug === slug);
}
