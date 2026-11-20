import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { contactantwoorden, contactberichten } from "@/db/schema";

/**
 * Contactberichten: opslaan vanuit het formulier, lezen en beantwoorden
 * vanuit het beheer. De rolcontrole zit in de pagina's en acties
 * (vereisDashboard); dit bestand doet alleen de database.
 */

export type ContactStatus = "nieuw" | "beantwoord" | "gearchiveerd";

export async function slaContactberichtOp(bericht: {
  naam: string;
  email: string;
  onderwerp: string;
  bericht: string;
  bron?: "formulier" | "handmatig";
  ontvangenOp?: Date;
}): Promise<string> {
  const [rij] = await db
    .insert(contactberichten)
    .values({ ...bericht, email: bericht.email.trim().toLowerCase() })
    .returning({ id: contactberichten.id });
  return rij.id;
}

export async function contactberichtenLijst(status: ContactStatus) {
  return db
    .select()
    .from(contactberichten)
    .where(eq(contactberichten.status, status))
    .orderBy(desc(contactberichten.ontvangenOp))
    .limit(200);
}

export async function contactAantallen(): Promise<Record<ContactStatus, number> & { ongelezen: number }> {
  const rijen = await db
    .select({ status: contactberichten.status, n: count() })
    .from(contactberichten)
    .groupBy(contactberichten.status);
  const [{ n: ongelezen }] = await db
    .select({ n: count() })
    .from(contactberichten)
    .where(and(eq(contactberichten.status, "nieuw"), isNull(contactberichten.gelezenOp)));
  const per = Object.fromEntries(rijen.map((r) => [r.status, r.n]));
  return {
    nieuw: per.nieuw ?? 0,
    beantwoord: per.beantwoord ?? 0,
    gearchiveerd: per.gearchiveerd ?? 0,
    ongelezen,
  };
}

/** Openstaande berichten: voor de menuteller en "Te doen". */
export async function openContactberichten(): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(contactberichten)
    .where(eq(contactberichten.status, "nieuw"));
  return n;
}

export async function contactberichtMetAntwoorden(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [bericht] = await db
    .select()
    .from(contactberichten)
    .where(eq(contactberichten.id, id))
    .limit(1);
  if (!bericht) return null;
  const antwoorden = await db
    .select()
    .from(contactantwoorden)
    .where(eq(contactantwoorden.berichtId, id))
    .orderBy(asc(contactantwoorden.verstuurdOp));
  return { bericht, antwoorden };
}

export async function markeerGelezen(id: string): Promise<void> {
  await db
    .update(contactberichten)
    .set({ gelezenOp: new Date() })
    .where(and(eq(contactberichten.id, id), isNull(contactberichten.gelezenOp)));
}

export async function zetContactStatus(id: string, status: ContactStatus): Promise<void> {
  await db.update(contactberichten).set({ status }).where(eq(contactberichten.id, id));
}

export async function legAntwoordVast(antwoord: {
  berichtId: string;
  onderwerp: string;
  tekst: string;
  verstuurdDoor: string;
}): Promise<void> {
  await db.insert(contactantwoorden).values(antwoord);
  await db
    .update(contactberichten)
    .set({ status: "beantwoord", gelezenOp: new Date() })
    .where(eq(contactberichten.id, antwoord.berichtId));
}
