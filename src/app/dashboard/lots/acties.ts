"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lots, recallNotices, recalls } from "@/db/schema";
import { recallOntvangers } from "@/db/queries";
import { vereisDashboard } from "@/lib/sessie";
import { magRecallOpenen, vereis } from "@/lib/rollen";

/**
 * §9.2 recall: select a lot, generate the affected customer list, queue a
 * Dutch notification and track acknowledgement per customer.
 *
 * Opening a recall mails customers, so it is admin-only — operations runs
 * the lot register but may not trigger that on their own (§9.7). The role
 * is checked here as well as in the layout: a server action is a public
 * endpoint, and the page guard does not protect it.
 */

export type RecallStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "gelukt"; lotNummer: string; aangeschreven: number };

export async function openRecall(
  _vorige: RecallStaat,
  formData: FormData,
): Promise<RecallStaat> {
  const actor = await vereisDashboard();
  vereis(magRecallOpenen(actor.rol), "een recall openen");

  const lotNummer = String(formData.get("lotNummer") ?? "").trim();
  const reden = String(formData.get("reden") ?? "").trim();

  if (!lotNummer) return { fase: "fout", melding: "Kies een lotnummer." };
  if (reden.length < 10) {
    return {
      fase: "fout",
      melding:
        "Beschrijf de reden. Die tekst gaat mee in de brief aan de afnemers.",
    };
  }

  const [lot] = await db
    .select({ id: lots.id })
    .from(lots)
    .where(eq(lots.lotNummer, lotNummer))
    .limit(1);
  if (!lot) return { fase: "fout", melding: `Lot ${lotNummer} bestaat niet.` };

  // Build the recipient list before opening, so an empty list is caught
  // before anything is written.
  const ontvangers = await recallOntvangers(actor, lotNummer);
  if (ontvangers.length === 0) {
    return {
      fase: "fout",
      melding: `Er zijn geen afnemers gevonden voor lot ${lotNummer}. Er valt niemand te waarschuwen.`,
    };
  }

  await db.transaction(async (tx) => {
    const [recall] = await tx
      .insert(recalls)
      .values({ lotId: lot.id, reden })
      .returning({ id: recalls.id });

    // One notice per recipient, queued rather than sent: sending happens
    // separately so a mail outage cannot lose the list.
    await tx.insert(recallNotices).values(
      ontvangers.map((o) => ({
        recallId: recall.id,
        userId: o.userId ?? null,
        email: o.email,
      })),
    );
  });

  revalidatePath("/dashboard/lots");
  revalidatePath("/dashboard/recalls");
  revalidatePath("/dashboard");

  return {
    fase: "gelukt",
    lotNummer,
    aangeschreven: ontvangers.length,
  };
}

/** Closes a recall once every affected customer has been dealt with. */
export async function sluitRecall(formData: FormData) {
  const actor = await vereisDashboard();
  vereis(magRecallOpenen(actor.rol), "een recall sluiten");

  const id = String(formData.get("recallId") ?? "");
  if (!id) return;

  await db
    .update(recalls)
    .set({ geslotenOp: new Date() })
    .where(eq(recalls.id, id));

  revalidatePath("/dashboard/recalls");
  revalidatePath("/dashboard");
}
