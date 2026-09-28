/**
 * Foto's en video van installaties bij klanten.
 *
 * Aangeleverd door de eigenaar, en anders dan de rest van het beeld op
 * deze site is dit géén weergave: dit zijn echte meterkasten waar de
 * module in hangt. Daarom staat er bij dit blok ook geen
 * "beeld is een weergave" — dat zou hier juist misleidend zijn.
 *
 * Bewust niet gekoppeld aan de losse beoordelingen hierboven. Welke klant
 * welke foto heeft gemaakt is niet vastgelegd, en een foto onder iemands
 * naam zetten die hij niet gemaakt heeft is precies het soort verzinsel
 * waar de rest van deze module tegen beschermt. Ze staan dus als groep.
 *
 * Wat er bij het klaarmaken is weggehaald: op een van de foto's stond een
 * sticker met straatnaam en postcode van het installatiebedrijf. Die is
 * er met een uitsnede af gehaald vóór publicatie. Controleer dat opnieuw
 * bij elke foto die hierna wordt toegevoegd — een meterkast hangt bij
 * iemand thuis, en daar hangen vaker papieren met gegevens naast.
 */

export type KlantMedia =
  | { soort: "foto"; src: string; alt: string }
  | { soort: "video"; src: string; poster: string; alt: string };

export const KLANTMEDIA: KlantMedia[] = [
  {
    soort: "video",
    src: "/media/klant/installatie.mp4",
    poster: "/media/klant/installatie.jpg",
    alt: "Opname van een installatie: de module wordt op de DIN-rail geklikt, het detectiekoord wordt langs de groepen gelegd en de kast gaat dicht",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-2.webp",
    alt: "Blusbox-module op de rail, direct boven een Eaton aardlekautomaat",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-1.webp",
    alt: "Meterkast met Blusbox tussen de installatieautomaten, naast een waarschuwingssticker voor zonnepanelen",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-5.webp",
    alt: "Hager-groepenkast met Blusbox naast de groepen voor warmtepomp en schuur",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-6.webp",
    alt: "Attema-kast met Blusbox onder de aardlekschakelaar die de blauwe groepen beveiligt",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-7.webp",
    alt: "Schneider-groepenkast met Blusbox op de rail naast de hoofdschakelaar",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-3.webp",
    alt: "Holec-groepenkast met Blusbox, met de groepenverklaring ernaast op de wand",
  },
  {
    soort: "foto",
    src: "/media/klant/installatie-4.webp",
    alt: "Houten meterkast met slimme meter, met de Blusbox onderaan de groepenkast",
  },
];
