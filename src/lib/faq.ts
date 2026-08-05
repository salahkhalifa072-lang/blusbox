/**
 * FAQ content. Answers may only lean on §1 of the brief; anything that
 * needs a norm, test report or certification carries a [VERIFY:] marker
 * for the client to fill in.
 */
export type FaqItem = {
  vraag: string;
  antwoord: string;
  /** Shown on the PDP excerpt as well as the full FAQ page */
  uitgelicht?: boolean;
};

export const faq: FaqItem[] = [
  {
    vraag: "Hoe weet Blusbox dat er brand is?",
    antwoord:
      "Blusbox meet niets en beslist niets. Langs de module loopt een detectiekoord dat reageert op warmte. Bereikt dat koord ongeveer 170 °C, dan activeert de module zichzelf. Er komt geen sensor, printplaat of software aan te pas.",
    uitgelicht: true,
  },
  {
    vraag: "Heeft Blusbox stroom of een batterij nodig?",
    antwoord:
      "Nee. Blusbox werkt volledig zonder voeding: geen bedrading, geen elektronica, geen batterij. Dat is precies de reden dat de module blijft werken als de installatie zelf het probleem is.",
    uitgelicht: true,
  },
  {
    vraag: "Past Blusbox in mijn meterkast?",
    antwoord:
      "Blusbox is gemaakt voor de standaard Nederlandse meterkast en wordt naast de hoofdschakelaar en de aardlekschakelaar gemonteerd. Twijfel je over de ruimte in jouw kast? Bekijk de maatvoering op de productpagina of stuur ons een foto van je groepenkast.",
    uitgelicht: true,
  },
  {
    vraag: "Beschadigt het blusmiddel mijn installatie?",
    antwoord:
      "Het residu is niet-geleidend en niet-corrosief voor de omliggende installatie. De aerosol vult de kast, onderdrukt de brand en laat de installatie intact.",
    uitgelicht: true,
  },
  {
    vraag: "Hoe lang gaat een module mee?",
    antwoord:
      "Tien jaar. Je registreert de installatiedatum in je account en krijgt automatisch bericht op twaalf, zes en één maand voor het einde van die termijn, met een vervangmodule die je in één klik bestelt.",
    uitgelicht: true,
  },
  {
    vraag: "Wat gebeurt er als de module afgaat terwijl er niemand thuis is?",
    antwoord:
      "Dan doet Blusbox exact waarvoor het gemaakt is. De module heeft geen mens nodig om te activeren en geen mens om te blussen. Je merkt het pas als je de kast opendoet.",
  },
  {
    vraag: "Vervangt Blusbox mijn rookmelders of aardlekschakelaar?",
    antwoord:
      "Nee, en dat is geen understatement. Een aardlekschakelaar voorkomt dat er iets misgaat; een rookmelder waarschuwt jou als er iets misgaat. Blusbox grijpt in als beide lagen al gepasseerd zijn. Het is een aanvulling, geen vervanging.",
    uitgelicht: true,
  },
  {
    vraag: "Mag ik Blusbox zelf monteren?",
    antwoord:
      "De module vraagt geen elektrotechnische aansluiting. Werkzaamheden in de meterkast blijven wel werkzaamheden in de meterkast: laat het bij twijfel door een installateur doen. De handleiding staat bij de downloads.",
  },
  {
    vraag: "Werkt Blusbox ook bij een thuisaccu of omvormer?",
    antwoord:
      "Blusbox is ontworpen voor elektrische behuizingen. Voor toepassing bij een thuisaccu of omvormerkast geldt een aparte beoordeling van het volume en de plaatsing. [VERIFY: toepassingsadvies thuisaccu/omvormer]",
  },
  {
    vraag: "Wat kost verzending en hoe snel is de levering?",
    antwoord:
      "Blusbox valt onder een gevaarlijke-goederenclassificatie, waardoor niet elke vervoerder en niet elke bestemming mogelijk is. Bij het afrekenen zie je direct wat er naar jouw adres verzonden kan worden. [VERIFY: verzendtarief en levertijd]",
  },
];

export const faqUitgelicht = faq.filter((f) => f.uitgelicht);
