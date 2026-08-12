"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { vereisDashboard } from "@/lib/sessie";
import { stuurBezorgbericht, stuurVerzendbericht } from "@/lib/mail";

/**
 * §9.5 afhandeling: een bestelling doorzetten naar verzonden of geleverd.
 *
 * Operations mag dit — het is dagelijks werk, geen terugroepactie. De
 * rolcontrole zit in `vereisDashboard`; alleen recall is admin-only (§9.7).
 *
 * De mail volgt op de statuswijziging en niet andersom. Blijft de mail
 * steken, dan is de bestelling nog steeds verzonden en kan het bericht
 * opnieuw. Zou het omgekeerd zijn, dan zou een storing bij de mailprovider
 * de afhandeling blokkeren.
 */

export type AfhandelStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

export async function markeerVerzonden(
  _vorige: AfhandelStaat,
  formData: FormData,
): Promise<AfhandelStaat> {
  await vereisDashboard();

  const ordernummer = String(formData.get("ordernummer") ?? "").trim();
  const track = String(formData.get("trackAndTrace") ?? "").trim();
  if (!ordernummer) return { fase: "fout", melding: "Geen bestelling gekozen." };

  const [order] = await db
    .select({ status: orders.status, verzondenOp: orders.verzondenOp })
    .from(orders)
    .where(eq(orders.ordernummer, ordernummer))
    .limit(1);

  if (!order) return { fase: "fout", melding: "Bestelling niet gevonden." };
  if (order.status === "nieuw") {
    return {
      fase: "fout",
      melding: "Deze bestelling is nog niet betaald. Niet verzenden.",
    };
  }
  if (order.verzondenOp) {
    return { fase: "fout", melding: "Al als verzonden gemarkeerd." };
  }

  await db
    .update(orders)
    .set({
      status: "verzonden",
      verzondenOp: new Date(),
      trackAndTrace: track || null,
    })
    .where(eq(orders.ordernummer, ordernummer));

  const mail = await stuurVerzendbericht(ordernummer);

  revalidatePath("/dashboard/bestellingen");
  revalidatePath("/dashboard");

  return {
    fase: "klaar",
    melding: mail.verstuurd
      ? `${ordernummer} staat op verzonden, bericht verstuurd.`
      : `${ordernummer} staat op verzonden, maar het bericht ging niet weg: ${mail.reden}`,
  };
}

export async function markeerGeleverd(
  _vorige: AfhandelStaat,
  formData: FormData,
): Promise<AfhandelStaat> {
  await vereisDashboard();

  const ordernummer = String(formData.get("ordernummer") ?? "").trim();
  if (!ordernummer) return { fase: "fout", melding: "Geen bestelling gekozen." };

  const [order] = await db
    .select({ geleverdOp: orders.geleverdOp })
    .from(orders)
    .where(eq(orders.ordernummer, ordernummer))
    .limit(1);

  if (!order) return { fase: "fout", melding: "Bestelling niet gevonden." };
  if (order.geleverdOp) {
    return { fase: "fout", melding: "Al als geleverd gemarkeerd." };
  }

  // Deze datum bepaalt wanneer de herroepingstermijn afloopt; hem later
  // aanpassen verschuift een wettelijke termijn, dus dat kan hier niet.
  await db
    .update(orders)
    .set({ status: "geleverd", geleverdOp: new Date() })
    .where(eq(orders.ordernummer, ordernummer));

  const mail = await stuurBezorgbericht(ordernummer);

  revalidatePath("/dashboard/bestellingen");
  revalidatePath("/dashboard");

  return {
    fase: "klaar",
    melding: mail.verstuurd
      ? `${ordernummer} staat op geleverd, bericht met de bedenktijd verstuurd.`
      : `${ordernummer} staat op geleverd, maar het bericht ging niet weg: ${mail.reden}`,
  };
}
