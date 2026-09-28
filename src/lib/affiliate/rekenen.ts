/**
 * De rekenkern van het affiliateprogramma.
 *
 * Alles hier is een pure functie zonder database: dat is met opzet, want
 * dit is het enige deel waar een fout direct geld kost. Zo kan elke regel
 * los getest worden zonder bestelling, webhook of sessie eromheen.
 *
 * Twee harde regels:
 *
 * 1. Geld is altijd een geheel aantal eurocenten. Nergens een float — 0,2
 *    is in binair geen 0,2, en na honderd bestellingen klopt de optelling
 *    niet meer met wat de affiliate op zijn scherm zag.
 * 2. Percentages staan in basispunten (2000 = 20,00%). Eén afronding aan
 *    het eind, nooit tussendoor.
 */

/** 20,00% als basispunten. */
export const STANDAARD_PERCENTAGE_BP = 2000;

/** Hoe lang een klik meetelt, in dagen. */
export const STANDAARD_ATTRIBUTIE_DAGEN = 30;

/** Onder dit bedrag wordt niet uitbetaald. */
export const STANDAARD_DREMPEL_CENTEN = 5000;

/** Wettelijke bedenktijd bij koop op afstand, in dagen. */
export const BEDENKTIJD_DAGEN = 14;

export type CommissieRegel = {
  /** Prijs per stuk, exclusief btw, zoals bevroren op de bestelling. */
  stukprijsExclBtwCenten: number;
  aantal: number;
  /** Producten met een te dunne marge doen niet mee. */
  uitgesloten?: boolean;
};

/**
 * De grondslag: de productwaarde waarover commissie wordt berekend.
 *
 * Wat er níét in zit, en waarom:
 *
 * - btw is geen omzet maar geld van de Belastingdienst dat wij alleen
 *   doorgeven. Commissie daarover betalen is geld weggeven dat nooit van
 *   ons was.
 * - verzendkosten zijn een doorbelaste kostenpost, geen marge. Bij Blusbox
 *   zijn ze bovendien altijd nul, maar de regel moet ook kloppen als dat
 *   ooit verandert.
 * - uitgesloten producten tellen niet mee, maar de rest van de bestelling
 *   wel. Eén uitgesloten regel mag de hele bestelling niet ongeldig maken.
 *
 * De stukprijs op een orderregel is al de prijs ná korting: die wordt bij
 * het afrekenen bevroren. Daarom staat hier geen kortingsberekening — die
 * zou de korting een tweede keer toepassen.
 */
export function grondslagCenten(regels: CommissieRegel[]): number {
  return regels
    .filter((r) => !r.uitgesloten)
    .reduce((som, r) => som + r.stukprijsExclBtwCenten * r.aantal, 0);
}

/**
 * Commissiebedrag over een grondslag.
 *
 * Rondt halve centen naar boven af, in het voordeel van de affiliate. Dat
 * is een keuze, geen toeval: het verschil is hooguit een cent per
 * bestelling, en bij twijfel hoort dat naar de partij te gaan die het werk
 * heeft gedaan. Math.round doet dat voor positieve bedragen.
 */
export function commissieCenten(
  grondslag: number,
  percentageBp: number,
): number {
  if (grondslag <= 0 || percentageBp <= 0) return 0;
  return Math.round((grondslag * percentageBp) / 10000);
}

/**
 * Wat er van een commissie overblijft na een gedeeltelijke terugbetaling.
 *
 * Werkt op de verhouding en niet op een nieuwe percentageberekening: als
 * de helft van de bestelling terugkomt, vervalt de helft van de commissie,
 * ook wanneer het percentage inmiddels is gewijzigd. De affiliate hoort
 * niet gestraft of beloond te worden voor een tariefwijziging van later.
 */
export function commissieNaTerugbetaling(opts: {
  oorspronkelijkeGrondslagCenten: number;
  terugbetaaldeGrondslagCenten: number;
  oorspronkelijkeCommissieCenten: number;
}): number {
  const { oorspronkelijkeGrondslagCenten: basis } = opts;
  if (basis <= 0) return 0;

  const terug = Math.min(Math.max(opts.terugbetaaldeGrondslagCenten, 0), basis);
  const resterend = basis - terug;
  if (resterend <= 0) return 0;

  return Math.round(
    (opts.oorspronkelijkeCommissieCenten * resterend) / basis,
  );
}

/**
 * Valt deze klik nog binnen de attributieperiode?
 *
 * Grens op de dag af, niet op het uur: een klik van precies dertig dagen
 * oud telt nog mee, eentje van dertig dagen en een seconde niet.
 */
export function klikIsGeldig(opts: {
  klikOp: Date;
  nu: Date;
  attributieDagen: number;
}): boolean {
  const verstreken = opts.nu.getTime() - opts.klikOp.getTime();
  if (verstreken < 0) return false;
  return verstreken <= opts.attributieDagen * 24 * 60 * 60 * 1000;
}

/**
 * Wanneer een commissie op zijn vroegst goedgekeurd mag worden.
 *
 * De bedenktijd loopt vanaf levering, niet vanaf de bestelling — dat is
 * wat art. 6:230o BW voorschrijft en wat de rest van deze webshop ook
 * aanhoudt. Zolang er niet geleverd is, is er dus geen rijpdatum.
 *
 * Bij balieverkoop is er geen koop op afstand en dus geen bedenktijd: de
 * klant heeft de module al in handen. Die commissie is meteen rijp.
 */
export function rijpOp(opts: {
  geleverdOp: Date | null;
  balieverkoop: boolean;
  betaaldOp: Date;
  bedenktijdDagen?: number;
}): Date | null {
  if (opts.balieverkoop) return opts.betaaldOp;
  if (!opts.geleverdOp) return null;

  const dagen = opts.bedenktijdDagen ?? BEDENKTIJD_DAGEN;
  return new Date(opts.geleverdOp.getTime() + dagen * 24 * 60 * 60 * 1000);
}

/**
 * Is deze bestelling een zelfverwijzing?
 *
 * Twee signalen, allebei hard genoeg om commissie te weigeren: dezelfde
 * ingelogde gebruiker, of hetzelfde e-mailadres. Hoofdletters en spaties
 * worden genegeerd, want "Jan@X.nl " en "jan@x.nl" zijn dezelfde persoon.
 *
 * Wat hier bewust níét in zit: adresvergelijking of gezinsleden opsporen.
 * Dat levert vals alarm op bij mensen die eerlijk een buurman helpen, en
 * daar is de beheerdersmarkering voor.
 */
export function isZelfverwijzing(opts: {
  affiliateUserId: string;
  affiliateEmail: string;
  bestellerUserId: string | null;
  bestellerEmail: string | null;
}): boolean {
  if (opts.bestellerUserId && opts.bestellerUserId === opts.affiliateUserId) {
    return true;
  }
  const normaliseer = (e: string | null) => (e ?? "").trim().toLowerCase();
  const a = normaliseer(opts.affiliateEmail);
  const b = normaliseer(opts.bestellerEmail);
  return a.length > 0 && a === b;
}

/**
 * Mag er uitbetaald worden?
 *
 * De drempel voorkomt dat er voor € 3,40 een bankopdracht wordt gemaakt.
 * Het restant blijft gewoon staan en telt de volgende ronde mee — er
 * vervalt niets.
 */
export function haaltDrempel(
  goedgekeurdCenten: number,
  drempelCenten: number,
): boolean {
  return goedgekeurdCenten >= drempelCenten && goedgekeurdCenten > 0;
}

/* ------------------------------------------------------------- slugs */

const SLUG_PATROON = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

/**
 * Namen die niet als affiliateslug mogen worden gebruikt: ze botsen met
 * bestaande routes of wekken de indruk dat het om Blusbox zelf gaat.
 */
const VERBODEN_SLUGS = new Set([
  "admin",
  "affiliate",
  "api",
  "blusbox",
  "dashboard",
  "info",
  "login",
  "r",
  "support",
  "www",
  "zakelijk",
]);

export type SlugOordeel = { geldig: true } | { geldig: false; reden: string };

export function beoordeelSlug(ruw: string): SlugOordeel {
  const slug = ruw.trim().toLowerCase();

  if (slug.length < 3) {
    return { geldig: false, reden: "Gebruik minimaal 3 tekens." };
  }
  if (slug.length > 32) {
    return { geldig: false, reden: "Gebruik maximaal 32 tekens." };
  }
  if (!SLUG_PATROON.test(slug)) {
    return {
      geldig: false,
      reden:
        "Alleen kleine letters, cijfers en koppeltekens, beginnend en eindigend met een letter of cijfer.",
    };
  }
  if (VERBODEN_SLUGS.has(slug)) {
    return { geldig: false, reden: "Dit woord is gereserveerd." };
  }
  return { geldig: true };
}

/** Maakt een bruikbare slug van een naam. Geen garantie op uniciteit. */
export function slugVoorstel(naam: string): string {
  const basis = naam
    .normalize("NFKD")
    // accenten eraf: "José" wordt "jose", niet "jos"
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");

  if (basis.length >= 3) return basis;

  // Niets bruikbaars overgehouden — "José" kan best "" worden als iemand
  // alleen leestekens invult. Dan een voorvoegsel, en daarna nogmaals de
  // koppeltekens van het eind halen: "partner-" alleen is geen geldige
  // slug, en dat merk je anders pas bij het opslaan.
  return `partner-${basis}`.slice(0, 32).replace(/-+$/g, "");
}

/* ------------------------------------------------------ bestemmingen */

/**
 * Is dit een bestemming waar wij naartoe mogen doorsturen?
 *
 * Alleen paden binnen de eigen site. Dit is de hele bescherming tegen een
 * open redirect: zonder deze controle kan iemand
 * /r/partner?naar=https://phishing.example bouwen, en dan staat er een
 * doorstuurlink naar een valse site op ons domein — met onze reputatie
 * eronder. Protocol-relatieve paden (//kwaadaardig.nl) zien er uit als een
 * pad maar zijn het niet, vandaar de expliciete afwijzing.
 */
export function veiligDoelPad(ruw: string | null | undefined): string {
  const pad = (ruw ?? "").trim();
  if (!pad.startsWith("/")) return "/";
  if (pad.startsWith("//")) return "/";
  if (pad.includes("\\")) return "/";
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(pad)) return "/";
  return pad;
}
