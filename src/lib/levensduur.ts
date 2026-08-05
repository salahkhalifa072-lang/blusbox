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
 * Which reminder (if any) is due for a unit on a given day. Returns the
 * largest overdue offset that has not been sent yet, so a unit that was
 * registered late still gets one message instead of three at once.
 */
export function verschuldigdeHerinnering(
  vervaldatum: IsoDatum,
  vandaag: IsoDatum,
  alVerzonden: { 12: boolean; 6: boolean; 1: boolean },
): HerinneringMaand | null {
  const datums = herinneringsdatums(vervaldatum);
  for (const maand of HERINNERING_MAANDEN) {
    if (!alVerzonden[maand] && vandaag >= datums[maand]) return maand;
  }
  return null;
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
