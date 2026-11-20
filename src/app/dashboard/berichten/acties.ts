"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { geldigEmail } from "@/lib/adres";
import { vereisDashboard } from "@/lib/sessie";
import { stuurContactantwoord } from "@/lib/mail";
import {
  contactberichtMetAntwoorden,
  legAntwoordVast,
  slaContactberichtOp,
  zetContactStatus,
  type ContactStatus,
} from "@/db/contact";

export type AntwoordStaat =
  | { fase: "leeg" }
  | {
      fase: "fout";
      melding: string;
      /** Wat er getypt was: React leegt het formulier na elke verzending. */
      waarden?: Record<string, string>;
    }
  | { fase: "klaar"; melding: string };

/**
 * Antwoord versturen vanaf info@blusbox.nl en vastleggen bij het bericht.
 * Het adres komt uit het opgeslagen bericht, nooit uit het formulier.
 */
export async function beantwoord(_: AntwoordStaat, formData: FormData): Promise<AntwoordStaat> {
  const actor = await vereisDashboard();
  const id = String(formData.get("id") ?? "");
  const onderwerp = String(formData.get("onderwerp") ?? "").trim().slice(0, 200);
  const tekst = String(formData.get("tekst") ?? "").trim().slice(0, 10000);

  if (!onderwerp) return { fase: "fout", waarden: { onderwerp, tekst }, melding: "Vul een onderwerp in." };
  if (tekst.length < 5) return { fase: "fout", waarden: { onderwerp, tekst }, melding: "Schrijf eerst je antwoord." };

  const gevonden = await contactberichtMetAntwoorden(id);
  if (!gevonden) return { fase: "fout", waarden: { onderwerp, tekst }, melding: "Bericht niet gevonden." };
  const { bericht } = gevonden;

  const mail = await stuurContactantwoord({
    naar: bericht.email,
    onderwerp,
    tekst,
    origineel: { naam: bericht.naam, bericht: bericht.bericht, ontvangenOp: bericht.ontvangenOp },
  });
  if (!mail.verstuurd) return { fase: "fout", waarden: { onderwerp, tekst }, melding: `Niet verstuurd: ${mail.reden}` };

  await legAntwoordVast({ berichtId: id, onderwerp, tekst, verstuurdDoor: actor.email });
  revalidatePath("/dashboard/berichten");
  revalidatePath(`/dashboard/berichten/${id}`);
  return { fase: "klaar", melding: `Verstuurd aan ${bericht.email}, vanaf info@blusbox.nl.` };
}

export async function zetStatus(formData: FormData): Promise<void> {
  await vereisDashboard();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ContactStatus;
  if (!["nieuw", "beantwoord", "gearchiveerd"].includes(status)) return;
  await zetContactStatus(id, status);
  revalidatePath("/dashboard/berichten");
  revalidatePath(`/dashboard/berichten/${id}`);
}

/**
 * Een bericht overnemen dat niet via het formulier binnenkwam: een mail,
 * een telefoontje, een WhatsApp. Daarna is het te beantwoorden zoals elk
 * ander bericht.
 */
export async function voegToe(_: AntwoordStaat, formData: FormData): Promise<AntwoordStaat> {
  await vereisDashboard();
  const naam = String(formData.get("naam") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const onderwerp = String(formData.get("onderwerp") ?? "").trim().slice(0, 200) || "Vraag";
  const bericht = String(formData.get("bericht") ?? "").trim().slice(0, 10000);
  const datum = String(formData.get("datum") ?? "");

  if (!naam) return { fase: "fout", waarden: { naam, email, onderwerp, bericht, datum }, melding: "Vul de naam in." };
  if (!geldigEmail(email)) return { fase: "fout", waarden: { naam, email, onderwerp, bericht, datum }, melding: "Vul een geldig e-mailadres in." };
  if (bericht.length < 2) return { fase: "fout", waarden: { naam, email, onderwerp, bericht, datum }, melding: "Plak het bericht." };

  const ontvangenOp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datum)
    ? new Date(`${datum}:00+01:00`)
    : new Date();

  const id = await slaContactberichtOp({ naam, email, onderwerp, bericht, bron: "handmatig", ontvangenOp });
  revalidatePath("/dashboard/berichten");
  redirect(`/dashboard/berichten/${id}`);
}
