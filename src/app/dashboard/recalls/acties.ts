"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lots, recalls } from "@/db/schema";
import {
  markeerVerzonden,
  openstaandeNotices,
  registreerBevestiging,
} from "@/db/queries";
import { vereisDashboard } from "@/lib/sessie";
import { magRecallOpenen, vereis } from "@/lib/rollen";
import { stuurTerugroepbericht } from "@/lib/mail";

/**
 * §9.2 versturen van de terugroepberichten.
 *
 * Los van het openen van de recall. De lijst met afnemers wordt bij het
 * openen vastgelegd; versturen is een aparte handeling, zodat een storing
 * bij de mailprovider de lijst nooit kwijtmaakt en je gewoon opnieuw kunt
 * proberen. Alleen berichten zonder `verzondenOp` gaan mee, dus tweemaal
 * drukken stuurt niemand een dubbele waarschuwing.
 */

export type VerzendStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | {
      fase: "klaar";
      verstuurd: number;
      mislukt: number;
      /** Adressen die niet werkten, zodat iemand ze met de hand kan nabellen */
      problemen: { email: string; reden: string }[];
    };

export async function verstuurTerugroepberichten(
  _vorige: VerzendStaat,
  formData: FormData,
): Promise<VerzendStaat> {
  const actor = await vereisDashboard();
  vereis(magRecallOpenen(actor.rol), "terugroepberichten versturen");

  const recallId = String(formData.get("recallId") ?? "").trim();
  if (!recallId) return { fase: "fout", melding: "Geen recall gekozen." };

  const [recall] = await db
    .select({
      id: recalls.id,
      reden: recalls.reden,
      lotNummer: lots.lotNummer,
      geslotenOp: recalls.geslotenOp,
    })
    .from(recalls)
    .innerJoin(lots, eq(lots.id, recalls.lotId))
    .where(eq(recalls.id, recallId))
    .limit(1);

  if (!recall) return { fase: "fout", melding: "Deze recall bestaat niet." };
  if (recall.geslotenOp) {
    return {
      fase: "fout",
      melding: "Deze recall is gesloten. Heropen hem voordat je nog mailt.",
    };
  }

  const openstaand = await openstaandeNotices(recallId);

  if (openstaand.length === 0) {
    return {
      fase: "fout",
      melding: "Alle berichten voor deze recall zijn al verstuurd.",
    };
  }

  let verstuurd = 0;
  const problemen: { email: string; reden: string }[] = [];

  // Bewust één voor één en niet parallel: Resend kent een snelheidslimiet,
  // en bij een terugroepactie is compleet belangrijker dan snel.
  for (const notice of openstaand) {
    const resultaat = await stuurTerugroepbericht({
      noticeId: notice.id,
      email: notice.email,
      lotNummer: recall.lotNummer,
      reden: recall.reden,
    });

    if (resultaat.verstuurd) {
      // Pas stempelen ná bevestiging van de provider. Andersom zou een
      // mislukte verzending eruitzien als afgehandeld.
      await markeerVerzonden(notice.id);
      verstuurd++;
    } else {
      problemen.push({ email: notice.email, reden: resultaat.reden });
    }
  }

  revalidatePath("/dashboard/recalls");
  revalidatePath("/dashboard");

  return {
    fase: "klaar",
    verstuurd,
    mislukt: problemen.length,
    problemen,
  };
}

/**
 * Bevestiging met de hand, voor wie telefonisch of per post reageert.
 * Zonder dit kan een afnemer die niet mailt nooit als afgehandeld gelden.
 */
export async function bevestigMetDeHand(formData: FormData) {
  const actor = await vereisDashboard();
  vereis(magRecallOpenen(actor.rol), "een bevestiging registreren");

  const noticeId = String(formData.get("noticeId") ?? "").trim();
  if (!noticeId) return;

  await registreerBevestiging(noticeId);

  // Ook de detailpagina, want dáár staat de knop.
  revalidatePath("/dashboard/recalls", "layout");
}
