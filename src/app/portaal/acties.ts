"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lots, registeredUnits } from "@/db/schema";
import { vereisInstallateur } from "@/lib/sessie";
import { berekenVervaldatum } from "@/lib/levensduur";
import { geldigePostcode, normaliseerPostcode } from "@/lib/adres";
import type { LocatieType } from "@/db/schema";

/**
 * §9.6 — an installer registers a placement so the ten-year clock starts
 * and the reminder can be forwarded to their customer later.
 *
 * The installer id comes from the session, never from the form: a company
 * must not be able to write placements into another company's register.
 */

export type PlaatsingStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string; velden?: Record<string, string> }
  | { fase: "gelukt"; vervaldatum: string; lotNummer: string };

const LOCATIES: LocatieType[] = [
  "woning",
  "appartement",
  "bedrijfspand",
  "vve_algemene_ruimte",
  "technische_ruimte",
  "anders",
];

export async function registreerPlaatsing(
  _vorige: PlaatsingStaat,
  formData: FormData,
): Promise<PlaatsingStaat> {
  const actor = await vereisInstallateur();

  const lotNummer = String(formData.get("lotNummer") ?? "").trim();
  const installatiedatum = String(formData.get("installatiedatum") ?? "").trim();
  const locatieType = String(formData.get("locatieType") ?? "woning");
  const postcode = String(formData.get("postcode") ?? "").trim();
  const serienummer = String(formData.get("serienummer") ?? "").trim();

  const velden: Record<string, string> = {};
  if (!lotNummer) velden.lotNummer = "Kies het lotnummer van de geplaatste module.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(installatiedatum)) {
    velden.installatiedatum = "Vul de installatiedatum in.";
  }
  if (postcode && !geldigePostcode(postcode, "NL")) {
    velden.postcode = "Vul een geldige postcode in, bijvoorbeeld 1011 AB.";
  }
  if (!LOCATIES.includes(locatieType as LocatieType)) {
    velden.locatieType = "Kies een locatietype.";
  }

  // A placement dated in the future would start the ten-year clock early
  // and send the reminder too soon.
  const vandaag = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
  if (installatiedatum > vandaag) {
    velden.installatiedatum = "De installatiedatum kan niet in de toekomst liggen.";
  }

  if (Object.keys(velden).length > 0) {
    return { fase: "fout", melding: "Controleer de gegevens.", velden };
  }

  const [lot] = await db
    .select({ id: lots.id })
    .from(lots)
    .where(eq(lots.lotNummer, lotNummer))
    .limit(1);
  if (!lot) {
    return { fase: "fout", melding: `Lot ${lotNummer} bestaat niet.` };
  }

  const vervaldatum = berekenVervaldatum(installatiedatum);

  await db.insert(registeredUnits).values({
    lotId: lot.id,
    installateurId: actor.id,
    installatiedatum,
    vervaldatum,
    locatieType: locatieType as LocatieType,
    postcode: postcode ? normaliseerPostcode(postcode, "NL") : null,
    serienummer: serienummer || null,
  });

  revalidatePath("/portaal");
  return { fase: "gelukt", vervaldatum, lotNummer };
}
