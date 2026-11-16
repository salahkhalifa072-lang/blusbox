/**
 * De uitlegvideo op de homepage: de reel waarin Blusbox in de meterkast
 * wordt uitgelegd en geplaatst.
 *
 * Bronbestand is een staande reel van 45 seconden (1080×1920). Voor de site
 * is hij opnieuw gecodeerd op 720×1280 (H.264, ±1,1 Mbit/s, ±6,7 MB).
 *
 * "Vandaag besteld, morgen in huis" aan het eind staat er op verzoek van de
 * eigenaar in: achter de schermen wordt express verzonden, en het is bedoeld
 * in werkdagen. Onder de video staat dat er ook zo bij ("op werkdagen"),
 * zodat de belofte niet ruimer leest dan hij is.
 *
 * De ondertiteling zit in het beeld gebrand, dus zonder geluid gaat er
 * niets verloren. Daarom mag hij stil automatisch starten.
 *
 * De tekst hieronder is uitgeschreven op basis van die ondertiteling.
 */

export const UITLEGVIDEO = {
  src: "/media/echt/blusbox-uitleg.mp4",
  poster: "/media/echt/blusbox-uitleg.jpg",
  breedte: 720,
  hoogte: 1280,
  duurSeconden: 45,
  /** Datum waarop hij op de site kwam, voor de gestructureerde gegevens. */
  geplaatst: "2026-11-16",
} as const;

export type Hoofdstuk = {
  /** Waar de knop naartoe springt, in seconden. */
  start: number;
  titel: string;
  tekst: string;
};

export const HOOFDSTUKKEN: Hoofdstuk[] = [
  {
    start: 0,
    titel: "Waarom de meterkast",
    tekst: "Alle stroom van je woning loopt erdoor, en hij wordt steeds zwaarder belast.",
  },
  {
    start: 13.6,
    titel: "Hoe hij ingrijpt",
    tekst: "Een losse verbinding wordt warm. De module grijpt in en laat blusaerosol vrij.",
  },
  {
    start: 27,
    titel: "Plaatsen in twee stappen",
    tekst: "Meterkast open, module op de DIN-rail klikken. Meer is het niet.",
  },
];

/** Uitgeschreven tekst, per hoofdstuk. */
export const TRANSCRIPT: string[] = [
  "Brand in je meterkast? De meterkast zit bijna in elk huis, en hij wordt steeds drukker. Alle stroom van je woning loopt hier doorheen: je warmtepomp, je laadpaal, je zonnepanelen. De meterkast wordt zwaarder belast, en dat neemt risico op brand. Het gebeurt ongeveer 3× per week in Nederland.",
  "Meestal begint het klein: een losse verbinding, een draad die warm wordt. Ontstaat de brand in je meterkast, dan detecteert hij via hier en hier, en komt de blusaerosol vrij. Geen stroom nodig, geen bediening nodig en geen mens nodig.",
  "Zo installeer je de Blusbox. Je zet hem open: dan heb je de meterkast open. Je klikt hem op de DIN-rail. Zo simpel. En dan komt het er zo uit te zien. Waar wacht je nog op? Bestel je Blusbox op blusbox.nl. Vandaag besteld, morgen in huis, en altijd gratis verzending.",
];

/** "0:13" uit 13.6 */
export function tijdcode(seconden: number): string {
  const s = Math.floor(seconden);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
