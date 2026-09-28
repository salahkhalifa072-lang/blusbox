import { STANDAARD_DREMPEL_CENTEN } from "./rekenen";
import { euro } from "@/lib/pricing";

/**
 * De teksten van het affiliateprogramma, op één plek.
 *
 * Staan hier en niet in de pagina's omdat ze op drie plekken terugkomen —
 * de publieke pagina, de voorwaarden en het dashboard — en uit elkaar gaan
 * lopen zodra ze op drie plekken worden overgetypt. Het percentage en de
 * drempel komen uit de rekenkern, zodat een wijziging daar ook hier
 * doorwerkt en er nooit 20% op de pagina staat terwijl het systeem 15
 * uitkeert.
 */

export const PROGRAMMA = {
  percentage: 20,
  attributieDagen: 30,
  drempel: euro(STANDAARD_DREMPEL_CENTEN),
  frequentie: "maandelijks",
} as const;

export const STAPPEN = [
  {
    nummer: "01",
    kop: "Aanmelden",
    tekst:
      "Vul het formulier in. Wij kijken ernaar en laten binnen een paar werkdagen weten of je meedoet.",
  },
  {
    nummer: "02",
    kop: "Je link delen",
    tekst:
      "Je krijgt een eigen link. Deel hem waar je wil: in een videobeschrijving, een nieuwsbrief, een offerte of gewoon in een appje.",
  },
  {
    nummer: "03",
    kop: "Commissie verdienen",
    tekst: `Bestelt iemand binnen ${PROGRAMMA.attributieDagen} dagen na jouw link, dan staat ${PROGRAMMA.percentage}% van de productwaarde op je naam.`,
  },
  {
    nummer: "04",
    kop: "Uitbetaling",
    tekst: `Na de bedenktijd van veertien dagen wordt de commissie goedgekeurd. Vanaf ${PROGRAMMA.drempel} betalen we ${PROGRAMMA.frequentie} uit.`,
  },
] as const;

export const VOORWAARDEN_KORT = [
  {
    kop: "Waarover je commissie krijgt",
    tekst:
      "Over de productwaarde na korting. Niet over btw en niet over verzendkosten — dat is geld dat wij doorgeven of voorschieten, geen omzet.",
  },
  {
    kop: "Wanneer een verkoop meetelt",
    tekst: `Als er binnen ${PROGRAMMA.attributieDagen} dagen na de klik op jouw link wordt besteld én betaald. Klikte iemand daarna op de link van een andere partner, dan telt die laatste.`,
  },
  {
    kop: "Retour of annulering",
    tekst:
      "Gaat een bestelling terug, dan vervalt de commissie. Bij een gedeeltelijke retour vervalt het deel dat terugkomt.",
  },
  {
    kop: "Je eigen bestellingen",
    tekst:
      "Via je eigen link bij jezelf bestellen levert geen commissie op. Dat herkennen we aan je account en je e-mailadres.",
  },
  {
    kop: "Hoe je promoot",
    tekst:
      "Eerlijk. Geen misleidende claims over brandveiligheid, geen beloftes die wij niet doen, geen advertenties op onze eigen merknaam en geen spam.",
  },
  {
    kop: "Opzeggen",
    tekst:
      "Je kunt altijd stoppen. Commissie die al is goedgekeurd wordt gewoon uitbetaald.",
  },
] as const;

export const VRAGEN = [
  {
    vraag: "Wat kost het om mee te doen?",
    antwoord:
      "Niets. Er zijn geen kosten, geen minimumaantal verkopen en geen verplichtingen.",
  },
  {
    vraag: "Wanneer krijg ik mijn geld?",
    antwoord: `Een verkoop staat eerst op "open" zolang de bedenktijd van veertien dagen loopt. Daarna wordt hij goedgekeurd. Zodra je goedgekeurde saldo boven ${PROGRAMMA.drempel} komt, gaat het bij de eerstvolgende ronde mee. Haal je de drempel niet, dan blijft het staan en telt het de volgende keer mee — er vervalt niets.`,
  },
  {
    vraag: "Hoe weet ik of een verkoop van mij is?",
    antwoord: `Wanneer iemand op jouw link klikt, onthouden wij dat ${PROGRAMMA.attributieDagen} dagen. Bestelt diegene binnen die termijn, dan zie je de verkoop in je dashboard verschijnen zodra de betaling rond is.`,
  },
  {
    vraag: "Zie ik wie er besteld heeft?",
    antwoord:
      "Nee. Je ziet dát er besteld is, wat het opleverde en wanneer. Naam, adres en e-mailadres van de klant krijg je niet te zien; dat zijn hun gegevens, niet de jouwe.",
  },
  {
    vraag: "Mag ik adverteren op Google?",
    antwoord:
      "Op algemene zoektermen mag dat. Adverteren op de merknaam Blusbox mag niet — dan betalen wij voor een klik die ons anders gratis had bereikt, en betalen we er ook nog commissie over.",
  },
  {
    vraag: "Wat als iemand zijn bestelling retourneert?",
    antwoord:
      "Dan vervalt de commissie over dat deel. Je ziet de regel in je dashboard op “teruggedraaid” springen, met de reden erbij.",
  },
  {
    vraag: "Kan ik mijn link aanpassen?",
    antwoord:
      "Je persoonlijke naam in de link kun je zelf kiezen, zolang hij vrij is. Daarnaast kun je links maken naar een specifieke pagina, bijvoorbeeld rechtstreeks naar de productpagina.",
  },
] as const;
