import { headers } from "next/headers";
import { and, count, countDistinct, desc, eq, gt, gte, lt, or, sql } from "drizzle-orm";
import { db, inlogpogingen, ipBlokkades } from "@/db";
import {
  GRENZEN,
  beoordeelIp,
  blokduurMs,
  normaliseerIp,
  nooitBlokkeren,
} from "@/lib/inlogregels";
import { bestelmeldingAdres } from "@/lib/mail";
import { mailBeschikbaar, verstuurMail } from "@/lib/mailtransport";

/**
 * Inlogbewaking: elke poging vastleggen, aanvallen herkennen (regels in
 * inlogregels.ts) en het adres meteen blokkeren.
 *
 * Een blokkade geldt voor inloggen, de code-stap en wachtwoordherstel,
 * niet voor de winkel. Mobiele providers delen één IP-adres met duizenden
 * klanten tegelijk; de hele site dichtzetten voor een adres betekent dat
 * je ook echte kopers wegstuurt.
 */

export type Soort = "wachtwoord" | "code" | "herstel";

const minutenGeleden = (m: number) => new Date(Date.now() - m * 60_000);

/**
 * Het IP-adres van de bezoeker.
 *
 * Vercel zet `x-real-ip` en `x-forwarded-for` zelf, en overschrijft wat een
 * bezoeker daar meestuurt; daarom zijn ze hier te vertrouwen. Zonder die
 * koppen (lokaal) wordt het "onbekend", en dat adres blokkeren we nooit:
 * anders sluit één blokkade iedereen buiten.
 */
export async function huidigIp(): Promise<string> {
  const h = await headers();
  const ruw = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "";
  return normaliseerIp(ruw) || "onbekend";
}

export async function ipGeblokkeerd(ip: string): Promise<boolean> {
  const [rij] = await db
    .select({ ip: ipBlokkades.ip })
    .from(ipBlokkades)
    .where(and(eq(ipBlokkades.ip, ip), gt(ipBlokkades.tot, new Date())))
    .limit(1);
  return Boolean(rij);
}

/** Regel 3: staat dit account onder vuur vanaf veel adressen tegelijk? */
export async function accountAfgekoeld(email: string): Promise<boolean> {
  const adres = email.trim().toLowerCase();
  if (!adres) return false;
  const [{ n }] = await db
    .select({ n: count() })
    .from(inlogpogingen)
    .where(
      and(
        eq(inlogpogingen.email, adres),
        eq(inlogpogingen.gelukt, false),
        gte(inlogpogingen.tijd, minutenGeleden(GRENZEN.accountFout.minuten)),
      ),
    );
  return n >= GRENZEN.accountFout.aantal;
}

/** Herstelmails: niet meer dan een paar per adres per uur (geen mailbom). */
export async function teveelHerstelmails(email: string): Promise<boolean> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(inlogpogingen)
    .where(
      and(
        eq(inlogpogingen.email, email.trim().toLowerCase()),
        eq(inlogpogingen.soort, "herstel"),
        gte(inlogpogingen.tijd, minutenGeleden(GRENZEN.herstelPerAdres.minuten)),
      ),
    );
  return n > GRENZEN.herstelPerAdres.aantal;
}

/**
 * Een poging vastleggen en, bij een mislukte, meteen beoordelen.
 * Geeft terug of het adres hierdoor (of al) geblokkeerd is.
 *
 * Een herstelaanvraag telt mee als "verdacht" voor regel 1: honderd keer
 * om een herstelmail vragen is ook een aanval, al is er niets fout getypt.
 */
export async function registreerPoging(poging: {
  ip: string;
  email?: string | null;
  soort: Soort;
  gelukt: boolean;
}): Promise<{ geblokkeerd: boolean }> {
  const email = poging.email?.trim().toLowerCase() || null;
  try {
    await db.insert(inlogpogingen).values({ ...poging, email });
  } catch (fout) {
    // Bewaking mag inloggen nooit breken. Dan maar één poging niet geteld.
    console.error("[inlogbewaking] poging niet vastgelegd:", fout);
    return { geblokkeerd: false };
  }

  if (poging.gelukt && poging.soort !== "herstel") return { geblokkeerd: false };

  if (email && !poging.gelukt) await meldAccountOnderVuur(email);
  if (nooitBlokkeren(poging.ip)) return { geblokkeerd: false };

  const verdacht = or(eq(inlogpogingen.gelukt, false), eq(inlogpogingen.soort, "herstel"));
  const [[fout], [adressen]] = await Promise.all([
    db
      .select({ n: count() })
      .from(inlogpogingen)
      .where(
        and(
          eq(inlogpogingen.ip, poging.ip),
          verdacht,
          gte(inlogpogingen.tijd, minutenGeleden(GRENZEN.ipFout.minuten)),
        ),
      ),
    db
      .select({ n: countDistinct(inlogpogingen.email) })
      .from(inlogpogingen)
      .where(
        and(
          eq(inlogpogingen.ip, poging.ip),
          eq(inlogpogingen.gelukt, false),
          gte(inlogpogingen.tijd, minutenGeleden(GRENZEN.ipAdressen.minuten)),
        ),
      ),
  ]);

  const reden = beoordeelIp({ ipFout: fout.n, ipAdressen: adressen.n });
  if (!reden) return { geblokkeerd: false };
  if (await ipGeblokkeerd(poging.ip)) return { geblokkeerd: true };
  await blokkeer(poging.ip, reden);
  return { geblokkeerd: true };
}

/**
 * Blokkeren, met oplopende duur voor wie terugkomt. Eén mail per nieuwe
 * blokkade, niet per poging: een aanval van duizenden pogingen mag geen
 * duizenden mails opleveren.
 */
export async function blokkeer(ip: string, reden: string): Promise<void> {
  const [bestaand] = await db
    .select({ keer: ipBlokkades.keer })
    .from(ipBlokkades)
    .where(eq(ipBlokkades.ip, ip))
    .limit(1);
  const keer = (bestaand?.keer ?? 0) + 1;
  const tot = new Date(Date.now() + blokduurMs(keer));

  await db
    .insert(ipBlokkades)
    .values({ ip, reden, tot, keer })
    .onConflictDoUpdate({
      target: ipBlokkades.ip,
      set: { reden, tot, keer, aangemaaktOp: new Date() },
    });

  console.warn(`[inlogbewaking] ${ip} geblokkeerd tot ${tot.toISOString()}: ${reden}`);
  await waarschuw(
    `Blusbox: IP-adres geblokkeerd na verdachte inlogpogingen`,
    [
      `Het adres ${ip} is automatisch geblokkeerd voor inloggen.`,
      ``,
      `Reden: ${reden}.`,
      `Geblokkeerd tot: ${tot.toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}${keer > 1 ? ` (${keer}e keer, daarom langer)` : ""}.`,
      ``,
      `Je hoeft niets te doen. Was jij het zelf (bijvoorbeeld een paar keer een verkeerd wachtwoord)? Hef de blokkade dan op via een ander netwerk, zoals 4G op je telefoon:`,
      `https://www.blusbox.nl/dashboard/beveiliging`,
    ].join("\n"),
  );
}

async function meldAccountOnderVuur(email: string): Promise<void> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(inlogpogingen)
    .where(
      and(
        eq(inlogpogingen.email, email),
        eq(inlogpogingen.gelukt, false),
        gte(inlogpogingen.tijd, minutenGeleden(GRENZEN.accountFout.minuten)),
      ),
    );
  // Precies op de grens: één mail bij het begin van de aanval.
  if (n !== GRENZEN.accountFout.aantal) return;
  console.warn(`[inlogbewaking] account ${email} onder vuur: ${n} foute pogingen`);
  await waarschuw(
    `Blusbox: veel foute inlogpogingen op ${email}`,
    [
      `In het laatste kwartier zijn er ${n} foute inlogpogingen gedaan op ${email}, vanaf meerdere adressen.`,
      ``,
      `Inloggen met een wachtwoord is voor dit account nu tijdelijk gepauzeerd. Dat heft zichzelf op zodra het rustig wordt.`,
      `Staat de code uit de authenticator-app aan, dan komt niemand binnen zonder je telefoon, ook niet met het goede wachtwoord.`,
      ``,
      `Overzicht: https://www.blusbox.nl/dashboard/beveiliging`,
    ].join("\n"),
  );
}

async function waarschuw(onderwerp: string, tekst: string): Promise<void> {
  const naar = process.env.MAIL_BEVEILIGING ?? bestelmeldingAdres();
  if (!naar || !mailBeschikbaar()) return;
  try {
    await verstuurMail({
      naar,
      onderwerp,
      tekst,
      html: `<pre style="font-family:inherit;white-space:pre-wrap">${tekst
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
    });
  } catch (fout) {
    console.error("[inlogbewaking] waarschuwing niet verstuurd:", fout);
  }
}

/* ------------------------------------------------------------ beheer */

export async function deblokkeer(ip: string): Promise<void> {
  await db.delete(ipBlokkades).where(eq(ipBlokkades.ip, ip));
}

export async function bewakingsoverzicht() {
  const dagGeleden = minutenGeleden(24 * 60);
  const [blokkades, recent, [stats]] = await Promise.all([
    db
      .select()
      .from(ipBlokkades)
      .where(gt(ipBlokkades.tot, new Date()))
      .orderBy(desc(ipBlokkades.aangemaaktOp)),
    db
      .select()
      .from(inlogpogingen)
      .where(or(eq(inlogpogingen.gelukt, false), eq(inlogpogingen.soort, "herstel")))
      .orderBy(desc(inlogpogingen.tijd))
      .limit(50),
    db
      .select({
        fout: sql<number>`count(*) filter (where ${inlogpogingen.gelukt} = false)`.mapWith(Number),
        gelukt: sql<number>`count(*) filter (where ${inlogpogingen.gelukt} = true and ${inlogpogingen.soort} <> 'herstel')`.mapWith(Number),
        adressen: sql<number>`count(distinct ${inlogpogingen.ip}) filter (where ${inlogpogingen.gelukt} = false)`.mapWith(Number),
      })
      .from(inlogpogingen)
      .where(gte(inlogpogingen.tijd, dagGeleden)),
  ]);
  return { blokkades, recent, stats };
}

/**
 * Opruimen, vanuit de dagelijkse cron: pogingen na 30 dagen weg (een
 * IP-adres is een persoonsgegeven), verlopen blokkades na 90 dagen. Die
 * 90 dagen zijn er zodat wie terugkomt een langere blokkade krijgt.
 */
export async function ruimBewakingOp(): Promise<{ pogingen: number; blokkades: number }> {
  const [pogingen, blokkades] = await Promise.all([
    db
      .delete(inlogpogingen)
      .where(lt(inlogpogingen.tijd, minutenGeleden(30 * 24 * 60)))
      .returning({ id: inlogpogingen.id }),
    db
      .delete(ipBlokkades)
      .where(lt(ipBlokkades.tot, minutenGeleden(90 * 24 * 60)))
      .returning({ ip: ipBlokkades.ip }),
  ]);
  return { pogingen: pogingen.length, blokkades: blokkades.length };
}
