"use server";

import { revalidatePath } from "next/cache";
import { leesWagen, schrijfWagen } from "@/lib/winkelwagen-cookie";
import { verwijder, voegToe } from "@/lib/winkelwagen";
import { ROOKMELDER_SLUG } from "@/lib/catalogus";

/**
 * De rookmelder aan- of uitzetten vanaf de afrekenpagina.
 *
 * Geen doorsturen naar de winkelwagen zoals bij "in winkelwagen" op de
 * productpagina: wie hier klikt is aan het afrekenen en hoort op deze
 * pagina te blijven, met het nieuwe totaal direct in beeld.
 *
 * Aanzetten zet er precies één in, ook bij een dubbelklik. Meer stuks kan
 * in de winkelwagen; een aanbod bij het afrekenen dat ongemerkt optelt is
 * het soort verrassing waar klanten terecht boos over worden.
 */
export async function zetRookmelder(formData: FormData): Promise<void> {
  const aan = formData.get("aan") === "ja";
  let wagen = verwijder(await leesWagen(), ROOKMELDER_SLUG);
  if (aan) wagen = voegToe(wagen, ROOKMELDER_SLUG, 1);
  await schrijfWagen(wagen);
  revalidatePath("/afrekenen");
  revalidatePath("/winkelwagen");
}
