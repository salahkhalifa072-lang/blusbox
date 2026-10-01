"use server";

import { revalidatePath } from "next/cache";
import { beoordeelInvoer } from "@/db/korting";
import { normaliseerCode } from "@/lib/korting";
import {
  schrijfKortingscode,
  wisKortingscode,
} from "@/lib/kortingscode-cookie";

/**
 * Een kortingscode toepassen of weghalen bij het afrekenen.
 *
 * De cookie krijgt alleen de code, nooit het percentage. Elke pagina die
 * daarna een bedrag toont, zoekt de code opnieuw op en beoordeelt hem
 * opnieuw. Dat kost een query, en dat is precies wat je ervoor terugkrijgt:
 * een code die vanmiddag wordt uitgezet werkt vanmiddag niet meer, ook
 * niet bij iemand die hem vanochtend al in zijn mandje had.
 */

export type KortingStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

export async function pasKortingToe(
  _vorige: KortingStaat,
  formData: FormData,
): Promise<KortingStaat> {
  const invoer = String(formData.get("code") ?? "");
  const code = normaliseerCode(invoer);

  if (!code) {
    return { fase: "fout", melding: "Vul een kortingscode in." };
  }

  const oordeel = await beoordeelInvoer(code);
  if (!oordeel.geldig) {
    // De eerder toegepaste code blijft staan: een typefout in een tweede
    // poging hoort de korting die iemand al had niet af te pakken.
    return { fase: "fout", melding: oordeel.reden };
  }

  await schrijfKortingscode(oordeel.code);
  revalidatePath("/afrekenen");
  revalidatePath("/winkelwagen");

  return { fase: "klaar", melding: "Kortingscode toegepast." };
}

export async function haalKortingWeg(): Promise<void> {
  await wisKortingscode();
  revalidatePath("/afrekenen");
  revalidatePath("/winkelwagen");
}
