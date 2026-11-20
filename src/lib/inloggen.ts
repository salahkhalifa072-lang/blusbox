import { eq } from "drizzle-orm";
import { db, users, credentials } from "@/db";
import { hashWachtwoord, verifieerWachtwoord } from "@/lib/wachtwoord";

/*
 * Voor onbekende e-mailadressen rekenen we tegen een nephash, zodat een
 * fout adres even lang duurt als een fout wachtwoord. Anders verraadt de
 * reactietijd welke adressen een account hebben, en weet een aanvaller
 * welk adres hij moet proberen.
 */
let nepHash: Promise<string> | null = null;
async function kostTijd(wachtwoord: string): Promise<null> {
  nepHash ??= hashWachtwoord("geen-account-maar-even-traag");
  await verifieerWachtwoord(wachtwoord, await nepHash);
  return null;
}

export type Inlogger = { id: string; email: string; name: string | null };

/**
 * E-mailadres en wachtwoord controleren, los van Auth.js.
 *
 * Twee plekken hebben dit nodig: de inlogpagina, die eerst moet weten of er
 * een tweede stap komt, en `authorize` in auth.ts, die het bij elke
 * aanmelding opnieuw doet. Eén functie, zodat die twee nooit uiteenlopen.
 */
export async function controleerWachtwoordLogin(
  emailInvoer: string,
  wachtwoord: string,
): Promise<Inlogger | null> {
  const email = emailInvoer.trim().toLowerCase();
  if (!email || !wachtwoord) return null;

  const [gebruiker] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!gebruiker) return kostTijd(wachtwoord);

  const [rij] = await db
    .select()
    .from(credentials)
    .where(eq(credentials.userId, gebruiker.id))
    .limit(1);
  if (!rij) return kostTijd(wachtwoord);

  if (!(await verifieerWachtwoord(wachtwoord, rij.wachtwoordHash))) return null;
  return { id: gebruiker.id, email: gebruiker.email, name: gebruiker.name };
}

export async function gebruikerOpId(id: string): Promise<Inlogger | null> {
  const [g] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return g ?? null;
}
