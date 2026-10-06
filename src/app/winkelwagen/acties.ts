"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leesWagen, schrijfWagen } from "@/lib/winkelwagen-cookie";
import { geldigeSlugs, verwijder, voegToe, wijzigAantal, type Winkelwagen } from "@/lib/winkelwagen";
import { ROOKMELDER_SLUG } from "@/lib/catalogus";

/**
 * Cart server actions. Every action re-validates the slug against the
 * catalogue: form input is untrusted, and an unknown slug must be ignored
 * rather than stored and rendered later.
 */

function geldig(slug: unknown): slug is string {
  return typeof slug === "string" && geldigeSlugs().includes(slug);
}

export async function voegToeAanWagen(formData: FormData) {
  const slug = formData.get("slug");
  if (!geldig(slug)) return;

  const aantal = Number(formData.get("aantal") ?? 1);
  await schrijfWagen(
    metRookmelder(voegToe(await leesWagen(), slug, aantal), formData),
  );

  revalidatePath("/winkelwagen");
  revalidatePath("/blusbox");

  // Zonder deze regel gebeurt er na de klik zichtbaar niets: de teller in de
  // kop ververst pas bij een paginawissel. Doorsturen naar de wagen is de
  // duidelijkste bevestiging en werkt ook zonder JavaScript.
  redirect("/winkelwagen");
}

export async function wijzigWagenAantal(formData: FormData) {
  const slug = formData.get("slug");
  if (!geldig(slug)) return;

  const aantal = Number(formData.get("aantal"));
  if (!Number.isFinite(aantal)) return;

  await schrijfWagen(wijzigAantal(await leesWagen(), slug, aantal));
  revalidatePath("/winkelwagen");
  revalidatePath("/afrekenen");
}

export async function verwijderUitWagen(formData: FormData) {
  const slug = formData.get("slug");
  if (typeof slug !== "string") return;

  await schrijfWagen(verwijder(await leesWagen(), slug));
  revalidatePath("/winkelwagen");
  revalidatePath("/afrekenen");
}

/**
 * Het vinkje "rookmelder erbij" op de productpagina. Eén stuk, en alleen
 * als hij er nog niet in zat: wie twee keer op een knop drukt hoort niet
 * ongemerkt twee rookmelders te krijgen.
 */
function metRookmelder(wagen: Winkelwagen, formData: FormData): Winkelwagen {
  if (formData.get("rookmelder") !== "ja") return wagen;
  if (wagen.regels.some((r) => r.slug === ROOKMELDER_SLUG)) return wagen;
  return voegToe(wagen, ROOKMELDER_SLUG, 1);
}

/**
 * Koop nu: in de wagen leggen en meteen door naar het afrekenen.
 *
 * Vijf stappen worden er drie. De winkelwagenpagina voegt op dit punt
 * niets toe: het afrekenscherm toont dezelfde samenvatting, het
 * rookmelderaanbod en een link om de wagen aan te passen.
 *
 * Het aantal wordt gezet, niet opgeteld. Wie eerder één Blusbox in de
 * wagen legde en nu op "Koop nu" drukt, bedoelt die ene — niet twee.
 * Zonder aantal (de knop op de homepage) wordt het minstens één.
 */
export async function koopNu(formData: FormData) {
  const slug = String(formData.get("slug") ?? "blusbox");
  if (!geldig(slug)) return;

  const ruw = formData.get("aantal");
  let wagen = await leesWagen();
  const huidig = wagen.regels.find((r) => r.slug === slug)?.aantal ?? 0;
  const gewenst = ruw === null ? Math.max(1, huidig) : Number(ruw);
  if (!Number.isFinite(gewenst) || gewenst < 1) return;

  // Aantal aanpassen als hij er al in zat, zodat de volgorde in het
  // overzicht niet verspringt; anders toevoegen.
  wagen = huidig > 0 ? wijzigAantal(wagen, slug, gewenst) : voegToe(wagen, slug, gewenst);
  await schrijfWagen(metRookmelder(wagen, formData));

  revalidatePath("/winkelwagen");
  revalidatePath("/afrekenen");
  redirect("/afrekenen");
}
