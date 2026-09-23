"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { vereisDashboard } from "@/lib/sessie";
import {
  stuurBerichtAanKlant,
  stuurBerichtkopie,
  stuurBezorgbericht,
  stuurVerzendbericht,
} from "@/lib/mail";
import { contactadresVanBestelling } from "@/db/queries";

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

/**
 * Een zelfgeschreven bericht aan de klant van één bestelling.
 *
 * Het ordernummer bepaalt de ontvanger; het formulier heeft geen
 * "aan"-veld. Dat is geen vergetelheid maar de begrenzing: hiermee kun je
 * je eigen klanten aanschrijven over hun eigen bestelling, en niets
 * anders. Een vrij adresveld zou dit een verzendmachine maken waarmee
 * iemand met dashboardtoegang post namens blusbox.nl rond kan sturen.
 *
 * De ondergrens op de berichtlengte vangt de lege verzending af die je
 * krijgt als iemand per ongeluk op Enter drukt in het onderwerpveld.
 */
export async function stuurKlantbericht(
  _vorige: AfhandelStaat,
  formData: FormData,
): Promise<AfhandelStaat> {
  await vereisDashboard();

  const ordernummer = String(formData.get("ordernummer") ?? "").trim();
  const onderwerp = String(formData.get("onderwerp") ?? "").trim();
  const bericht = String(formData.get("bericht") ?? "").trim();

  if (!ordernummer) return { fase: "fout", melding: "Geen bestelling gekozen." };
  if (!onderwerp) return { fase: "fout", melding: "Vul een onderwerp in." };
  if (bericht.length < 10) {
    return { fase: "fout", melding: "Schrijf eerst een bericht." };
  }

  const [order] = await db
    .select({ ordernummer: orders.ordernummer })
    .from(orders)
    .where(eq(orders.ordernummer, ordernummer))
    .limit(1);
  if (!order) return { fase: "fout", melding: "Bestelling niet gevonden." };

  const klantEmail = await contactadresVanBestelling(ordernummer);
  if (!klantEmail) {
    return { fase: "fout", melding: "Geen e-mailadres bij deze bestelling." };
  }

  const mail = await stuurBerichtAanKlant(ordernummer, onderwerp, bericht);
  if (!mail.verstuurd) {
    return { fase: "fout", melding: `Niet verstuurd: ${mail.reden}` };
  }

  // De kopie volgt pas na een geslaagde klantmail, en telt niet mee voor
  // het slagen ervan: het bericht ís verstuurd, dat kan een mislukte
  // kopie niet meer ongedaan maken. Wel benoemen, anders denk je straks
  // dat er niets gestuurd is omdat je niets in je eigen postvak ziet.
  const kopie = await stuurBerichtkopie(
    ordernummer,
    klantEmail,
    onderwerp,
    bericht,
  );

  return {
    fase: "klaar",
    melding: kopie.verstuurd
      ? `Verstuurd aan ${klantEmail}. Kopie staat in je postvak.`
      : `Verstuurd aan ${klantEmail}. Kopie mislukte: ${kopie.reden}`,
  };
}
