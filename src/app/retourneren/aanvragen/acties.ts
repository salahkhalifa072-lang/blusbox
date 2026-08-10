"use server";

import { RetourGeweigerd, vraagRetourAan } from "@/lib/retour";
import { geldigEmail } from "@/lib/adres";
import { formatteerNl } from "@/lib/levensduur";

export type RetourStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string; oplossing?: string; velden?: Record<string, string> }
  | {
      fase: "gelukt";
      ordernummer: string;
      binnenTermijn: boolean;
      uiterlijk: string;
    };

export async function meldRetourAan(
  _vorige: RetourStaat,
  formData: FormData,
): Promise<RetourStaat> {
  const ordernummer = String(formData.get("ordernummer") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const reden = String(formData.get("reden") ?? "").trim();

  const velden: Record<string, string> = {};
  if (!ordernummer) {
    velden.ordernummer = "Vul je bestelnummer in, bijvoorbeeld BB-2026-000123.";
  }
  if (!geldigEmail(email)) {
    velden.email = "Vul het e-mailadres in waarmee je hebt besteld.";
  }
  if (Object.keys(velden).length > 0) {
    return { fase: "fout", melding: "Controleer de ingevulde gegevens.", velden };
  }

  try {
    const uitkomst = await vraagRetourAan({ ordernummer, email, reden });
    return {
      fase: "gelukt",
      ordernummer: uitkomst.ordernummer,
      binnenTermijn: uitkomst.binnenTermijn,
      uiterlijk: formatteerNl(uitkomst.uiterlijk),
    };
  } catch (fout) {
    if (fout instanceof RetourGeweigerd) {
      return { fase: "fout", melding: fout.message, oplossing: fout.oplossing };
    }
    console.error("Retouraanvraag mislukt:", fout);
    return {
      fase: "fout",
      melding: "Er ging iets mis bij het verwerken van je aanvraag.",
      oplossing: "Probeer het opnieuw, of neem contact met ons op.",
    };
  }
}
