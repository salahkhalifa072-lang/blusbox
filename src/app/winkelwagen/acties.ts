"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leesWagen, schrijfWagen } from "@/lib/winkelwagen-cookie";
import { geldigeSlugs, verwijder, voegToe, wijzigAantal } from "@/lib/winkelwagen";

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
  await schrijfWagen(voegToe(await leesWagen(), slug, aantal));

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
}

export async function verwijderUitWagen(formData: FormData) {
  const slug = formData.get("slug");
  if (typeof slug !== "string") return;

  await schrijfWagen(verwijder(await leesWagen(), slug));
  revalidatePath("/winkelwagen");
}
