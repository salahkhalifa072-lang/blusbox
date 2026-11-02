import { cookies } from "next/headers";
import { meetId } from "./meting";
import { TOESTEMMING_COOKIE, TOESTEMMING_VERSIE } from "./toestemming";
import { TOEGEVOEGD_COOKIE, type TrechterStap } from "./trechter";
import { berekenWagen, verschilWagen, type WagenOverzicht, type Winkelwagen } from "./winkelwagen";

/** De toestemmingskeuze op de server: voor wat er ná de browser gebeurt. */
export async function heeftMeetToestemming(): Promise<boolean> {
  const pot = await cookies();
  const keuze = decodeURIComponent(pot.get(TOESTEMMING_COOKIE)?.value ?? "");
  return keuze === `verleend.${TOESTEMMING_VERSIE}`;
}

/** Een wagenoverzicht in de vorm die de meting nodig heeft. */
export function trechterStap(overzicht: WagenOverzicht): TrechterStap {
  return {
    regels: overzicht.regels.map((r) => ({
      id: meetId(r.item.slug),
      naam: r.item.naam,
      aantal: r.aantal,
      stukprijsCenten: Math.round(r.regelExclBtwCenten / r.aantal),
    })),
    waardeCenten: overzicht.totalen.subtotaalExclBtwCenten,
  };
}

/**
 * Na een geslaagde wijziging van de wagen: laat voor de browser achter wat
 * er bij kwam. Zie meldToevoeging in lib/trechter.
 *
 * Alleen met toestemming, want zonder mag er geen meetcookie komen. Het
 * bedrag is vóór een eventuele kortingscode: die bepaalt de server pas
 * bij het afrekenen, en daar meet startAfrekenen het echte bedrag.
 */
export async function onthoudToevoeging(
  oud: Winkelwagen,
  nieuw: Winkelwagen,
): Promise<void> {
  const erbij = verschilWagen(oud, nieuw);
  if (erbij.regels.length === 0 || !(await heeftMeetToestemming())) return;

  const stap = trechterStap(
    berekenWagen(erbij, { landcode: "NL", isZakelijk: false, btwIdGevalideerd: false }),
  );
  (await cookies()).set(TOEGEVOEGD_COOKIE, JSON.stringify(stap), {
    // Leesbaar voor de browser: daar moet hij gemeld worden.
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 120,
  });
}
