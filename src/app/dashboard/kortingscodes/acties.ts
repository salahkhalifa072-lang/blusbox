"use server";

import { revalidatePath } from "next/cache";
import { vereisDashboard } from "@/lib/sessie";
import { zetActief } from "@/db/korting";
import { normaliseerCode } from "@/lib/korting";

/**
 * Een kortingscode aan- of uitzetten.
 *
 * Uitzetten en niet verwijderen. Een verwijderde code laat bestellingen
 * achter met een kortingsbedrag dat nergens meer op terug te voeren is;
 * een uitgezette code blijft verklaarbaar en is met één klik terug.
 */

export type CodeStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

export async function wisselActief(
  _vorige: CodeStaat,
  formData: FormData,
): Promise<CodeStaat> {
  await vereisDashboard();

  const code = normaliseerCode(String(formData.get("code") ?? ""));
  const naar = formData.get("naar") === "aan";

  if (!code) return { fase: "fout", melding: "Geen code opgegeven." };

  try {
    await zetActief(code, naar);
  } catch (fout) {
    return {
      fase: "fout",
      melding: `Niet gelukt: ${(fout as Error).message}`,
    };
  }

  revalidatePath("/dashboard/kortingscodes");
  revalidatePath("/afrekenen");

  return {
    fase: "klaar",
    melding: naar
      ? `${code} staat weer aan.`
      : `${code} is uitgezet; nieuwe bestellingen krijgen geen korting meer.`,
  };
}
