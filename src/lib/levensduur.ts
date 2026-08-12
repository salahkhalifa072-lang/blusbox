/**
 * End-of-life maths (§9.3). The reminder schedule is the repeat-purchase
 * model, so this is revenue logic, not a utility.
 *
 * Dates are handled as calendar dates in Europe/Amsterdam, formatted
 * dd-mm-jjjj. We deliberately do not use UTC timestamps: "ten years after
 * 1 March" is a calendar question, not a duration in milliseconds.
 */

export const LEVENSDUUR_JAAR = 10;

/** Reminder offsets in months before expiry (§9.3). */
export const HERINNERING_MAANDEN = [12, 6, 1] as const;
export type HerinneringMaand = (typeof HERINNERING_MAANDEN)[number];

/** ISO yyyy-mm-dd, the format the `date` columns store. */
export type IsoDatum = string;

function parseIso(datum: IsoDatum): { j: number; m: number; d: number } {
  const [j, m, d] = datum.split("-").map(Number);
  if (!j || !m || !d) throw new Error(`Ongeldige datum: ${datum}`);
  return { j, m, d };
}

function toIso(j: number, m: number, d: number): IsoDatum {
  return `${String(j).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(
    d,
  ).padStart(2, "0")}`;
}

function dagenInMaand(jaar: number, maand: number): number {
  return new Date(Date.UTC(jaar, maand, 0)).getUTCDate();
}

/**
 * Adds calendar months, clamping to the last day of the target month.
 * 31-01 plus one month is 28-02 (or 29-02 in a leap year), never 03-03.
 */
export function plusMaanden(datum: IsoDatum, maanden: number): IsoDatum {
  const { j, m, d } = parseIso(datum);
  const totaal = (j * 12 + (m - 1)) + maanden;
  const nieuwJaar = Math.floor(totaal / 12);
  const nieuweMaand = (totaal % 12) + 1;
  const dag = Math.min(d, dagenInMaand(nieuwJaar, nieuweMaand));
  return toIso(nieuwJaar, nieuweMaand, dag);
}

/** installatiedatum + 10 jaar. 29-02 becomes 28-02 ten years later. */
export function berekenVervaldatum(installatiedatum: IsoDatum): IsoDatum {
  return plusMaanden(installatiedatum, LEVENSDUUR_JAAR * 12);
}

/** The date each reminder should be sent. */
export function herinneringsdatums(
  vervaldatum: IsoDatum,
): Record<HerinneringMaand, IsoDatum> {
  return {
    12: plusMaanden(vervaldatum, -12),
    6: plusMaanden(vervaldatum, -6),
    1: plusMaanden(vervaldatum, -1),
  };
}

/**
 * Welke herinnering vandaag verschuldigd is. Geeft de **meest dringende**
 * termijn terug die nog niet verstuurd is.
 *
 * Dringend eerst, en niet andersom. Een unit die pas laat wordt
 * geregistreerd heeft alle drie de momenten al gepasseerd; die klant een
 * mail sturen dat zijn module "over een jaar" verloopt terwijl het over
 * twee weken is, is erger dan geen mail. De overgeslagen termijnen zijn
 * daarmee achterhaald — `achterhaaldeHerinneringen` zegt welke dat zijn,
 * zodat ze afgestempeld kunnen worden en er niet alsnog een onjuist bericht
 * achteraan komt.
 */
export function verschuldigdeHerinnering(
  vervaldatum: IsoDatum,
  vandaag: IsoDatum,
  alVerzonden: { 12: boolean; 6: boolean; 1: boolean },
): HerinneringMaand | null {
  const datums = herinneringsdatums(vervaldatum);
  // van dringend naar ruim: 1, 6, 12
  for (const maand of [...HERINNERING_MAANDEN].reverse()) {
    if (!alVerzonden[maand] && vandaag >= datums[maand]) return maand;
  }
  return null;
}

/**
 * De termijnen die met het versturen van `maand` hun betekenis verliezen.
 *
 * Wie de eenmaandsherinnering krijgt, hoeft daarna niet alsnog te horen dat
 * zijn module over een half jaar verloopt.
 */
export function achterhaaldeHerinneringen(
  maand: HerinneringMaand,
): HerinneringMaand[] {
  return HERINNERING_MAANDEN.filter((m) => m > maand);
}

export function isVerlopen(vervaldatum: IsoDatum, vandaag: IsoDatum): boolean {
  return vandaag > vervaldatum;
}

/** §9.1 dashboard tile: units expiring within twelve months. */
export function verlooptBinnenMaanden(
  vervaldatum: IsoDatum,
  vandaag: IsoDatum,
  maanden = 12,
): boolean {
  return vervaldatum > vandaag && vervaldatum <= plusMaanden(vandaag, maanden);
}

/** dd-mm-jjjj, the Dutch convention required by the brief. */
export function formatteerNl(datum: IsoDatum): string {
  const { j, m, d } = parseIso(datum);
  return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${j}`;
}

/* ------------------------------------------------- herroepingstermijn */

/**
 * §8: the 14-day withdrawal window runs from the day after delivery.
 * Used to freeze `binnenHerroepingstermijn` on a return request.
 */
export const HERROEPINGSTERMIJN_DAGEN = 14;

export function herroepingUiterlijk(leverdatum: IsoDatum): IsoDatum {
  const { j, m, d } = parseIso(leverdatum);
  const dt = new Date(Date.UTC(j, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + HERROEPINGSTERMIJN_DAGEN);
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function binnenHerroepingstermijn(
  leverdatum: IsoDatum,
  aanvraagdatum: IsoDatum,
): boolean {
  return aanvraagdatum <= herroepingUiterlijk(leverdatum);
}
