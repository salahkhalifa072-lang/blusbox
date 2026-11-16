"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { vereisDashboard } from "@/lib/sessie";
import { magVerkopersBeheren, vereis } from "@/lib/rollen";
import { geldigEmail } from "@/lib/adres";
import { vraagHerstelAan } from "@/db/wachtwoord-herstel";
import { stuurVerkoperUitnodiging } from "@/lib/wachtwoord-mail";

export type VerkoperStaat = { fase: "leeg" } | { fase: "fout" | "klaar"; melding: string };

/**
 * Verkoper toevoegen of opnieuw uitnodigen. Een bestaand klantaccount
 * wordt verkoper; een account met een andere rol (beheer, installateur,
 * partner) wordt niet stil omgezet — dat zou rechten weghalen of geven
 * zonder dat iemand het merkt.
 */
export async function voegVerkoperToe(_v: VerkoperStaat, formData: FormData): Promise<VerkoperStaat> {
  const actor = await vereisDashboard();
  vereis(magVerkopersBeheren(actor.rol), "verkopers beheren");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const naam = String(formData.get("naam") ?? "").trim() || null;
  if (!geldigEmail(email)) return { fase: "fout", melding: "Vul een geldig e-mailadres in." };

  const [bestaand] = await db.select({ id: users.id, rol: users.rol }).from(users).where(eq(users.email, email)).limit(1);
  if (bestaand && bestaand.rol !== "klant" && bestaand.rol !== "verkoper") {
    return { fase: "fout", melding: `Dit adres heeft al een account met de rol "${bestaand.rol}". Gebruik een ander adres.` };
  }
  if (bestaand) {
    await db.update(users).set({ rol: "verkoper", ...(naam ? { name: naam } : {}) }).where(eq(users.id, bestaand.id));
  } else {
    await db.insert(users).values({ email, name: naam, rol: "verkoper" });
  }
  revalidatePath("/dashboard/verkopers");

  const aanvraag = await vraagHerstelAan(email);
  if (!aanvraag) {
    return { fase: "klaar", melding: `${email} is verkoper. De uitnodiging is net al verstuurd; probeer het over een uur opnieuw als hij niet aankomt.` };
  }
  const mail = await stuurVerkoperUitnodiging({ naar: email, naam, token: aanvraag.token });
  return mail.verstuurd
    ? { fase: "klaar", melding: `${email} is verkoper en heeft een mail gekregen om een wachtwoord te kiezen.` }
    : { fase: "fout", melding: `${email} is verkoper, maar de uitnodiging ging niet weg: ${mail.reden}` };
}

/** Toegang intrekken: het account blijft, de verkooprechten niet. */
export async function trekVerkoperIn(formData: FormData) {
  const actor = await vereisDashboard();
  vereis(magVerkopersBeheren(actor.rol), "verkopers beheren");
  const id = String(formData.get("id") ?? "");
  if (id) await db.update(users).set({ rol: "klant" }).where(eq(users.id, id));
  revalidatePath("/dashboard/verkopers");
}
