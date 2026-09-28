"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { affiliates, affiliateVoorwaarden } from "@/db/affiliate-schema";
import { credentials } from "@/db/auth-schema";
import { users } from "@/db/schema";
import { hashWachtwoord, wachtwoordProblemen } from "@/lib/wachtwoord";
import { beoordeelSlug, slugVoorstel } from "@/lib/affiliate/rekenen";
import { haalInstellingen, schrijfAuditregel } from "@/db/affiliate";

/**
 * Aanmelden als affiliate.
 *
 * Maakt in één keer een inlogaccount én een aanvraag. Dat scheelt de
 * aanvrager een tweede formulier en ons een losse uitnodigingsmail met een
 * link erin — precies het soort link waar Chrome eerder een
 * phishingwaarschuwing voor gaf.
 *
 * De aanvraag begint op "aangevraagd". Tot een beheerder hem goedkeurt
 * werkt de persoonlijke link niet en levert een bestelling niets op; dat
 * wordt in de doorstuurroute en bij het aanmaken van de commissie
 * opnieuw gecontroleerd, niet alleen hier.
 */

export type AanmeldStaat =
  | { fase: "leeg" }
  | { fase: "fout"; velden?: Record<string, string>; melding?: string }
  | { fase: "klaar"; melding: string };

/** Ruwe invoer opschonen: lengte begrenzen en witruimte eraf. */
function tekst(v: FormDataEntryValue | null, max = 200): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function meldAan(
  _vorige: AanmeldStaat,
  formData: FormData,
): Promise<AanmeldStaat> {
  const instellingen = await haalInstellingen();
  if (!instellingen.programmaActief) {
    return {
      fase: "fout",
      melding: "Het affiliateprogramma neemt op dit moment geen nieuwe aanmeldingen aan.",
    };
  }

  const naam = tekst(formData.get("naam"), 120);
  const email = tekst(formData.get("email"), 160).toLowerCase();
  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  const bedrijfsnaam = tekst(formData.get("bedrijfsnaam"), 120);
  const website = tekst(formData.get("website"), 200);
  const kanalen = tekst(formData.get("kanalen"), 300);
  const promotiemethode = tekst(formData.get("promotiemethode"), 1000);
  const landcode = tekst(formData.get("landcode"), 2).toUpperCase() || "NL";
  const uitbetaalmethode = tekst(formData.get("uitbetaalmethode"), 40);
  const gewensteSlug = tekst(formData.get("slug"), 32).toLowerCase();
  const akkoord = formData.get("akkoord") === "ja";

  const velden: Record<string, string> = {};

  if (naam.length < 2) velden.naam = "Vul je naam in.";
  // Geen streng e-mailpatroon: die sluiten altijd geldige adressen uit.
  // Genoeg om typefouten te vangen; of het adres echt bestaat blijkt
  // vanzelf uit de mail die erheen gaat.
  if (!email.includes("@") || email.length < 5) {
    velden.email = "Vul een geldig e-mailadres in.";
  }
  const wachtwoordfouten = wachtwoordProblemen(wachtwoord);
  if (wachtwoordfouten.length > 0) {
    velden.wachtwoord = wachtwoordfouten.join(" ");
  }
  if (promotiemethode.length < 10) {
    velden.promotiemethode = "Vertel kort hoe je Blusbox wil promoten.";
  }
  if (!akkoord) {
    velden.akkoord = "Je moet akkoord gaan met de voorwaarden.";
  }

  const slugKeuze = gewensteSlug || slugVoorstel(bedrijfsnaam || naam);
  const slugOordeel = beoordeelSlug(slugKeuze);
  if (!slugOordeel.geldig) {
    velden.slug = slugOordeel.reden;
  }

  if (Object.keys(velden).length > 0) return { fase: "fout", velden };

  // Bestaat het adres al? Dan hangen we de aanvraag aan die gebruiker in
  // plaats van een tweede account te maken — twee accounts op één adres
  // maakt inloggen onvoorspelbaar.
  const [bestaandeGebruiker] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (bestaandeGebruiker) {
    const [alAffiliate] = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.userId, bestaandeGebruiker.id))
      .limit(1);
    if (alAffiliate) {
      return {
        fase: "fout",
        melding:
          "Er loopt al een aanmelding op dit e-mailadres. Log in om de status te bekijken.",
      };
    }
  }

  const [slugBezet] = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(eq(affiliates.slug, slugKeuze))
    .limit(1);
  if (slugBezet) {
    return {
      fase: "fout",
      velden: { slug: "Deze naam is al in gebruik. Kies een andere." },
    };
  }

  try {
    await db.transaction(async (tx) => {
      let userId = bestaandeGebruiker?.id;

      if (!userId) {
        const [nieuw] = await tx
          .insert(users)
          .values({ email, name: naam, rol: "klant", aanspreekvorm: "je" })
          .returning({ id: users.id });
        userId = nieuw.id;
      }

      // Wachtwoord alleen zetten als er nog geen was: iemand die al klant
      // is houdt zijn eigen wachtwoord, anders zou dit formulier een
      // manier zijn om het wachtwoord van een bestaand account te
      // overschrijven door het e-mailadres te raden.
      await tx
        .insert(credentials)
        .values({ userId, wachtwoordHash: await hashWachtwoord(wachtwoord) })
        .onConflictDoNothing({ target: credentials.userId });

      const [affiliate] = await tx
        .insert(affiliates)
        .values({
          userId,
          slug: slugKeuze,
          status: "aangevraagd",
          bedrijfsnaam: bedrijfsnaam || null,
          website: website || null,
          kanalen: kanalen || null,
          promotiemethode,
          landcode,
          uitbetaalmethode: uitbetaalmethode || null,
        })
        .returning({ id: affiliates.id });

      // Vastleggen wélke versie is geaccepteerd. Bij een geschil is "hij
      // ging akkoord" te weinig; het gaat om waarmee.
      await tx.insert(affiliateVoorwaarden).values({
        affiliateId: affiliate.id,
        versie: instellingen.voorwaardenVersie,
      });
    });
  } catch (fout) {
    console.error("Affiliate-aanmelding mislukt:", (fout as Error).message);
    return {
      fase: "fout",
      melding: "Er ging iets mis bij het opslaan. Probeer het opnieuw.",
    };
  }

  await schrijfAuditregel({
    actie: "aanmelding_ontvangen",
    details: `${naam} (${slugKeuze})`,
  }).catch(() => {});

  return {
    fase: "klaar",
    melding:
      "Je aanmelding staat genoteerd. Wij kijken ernaar en laten binnen een paar werkdagen iets weten. Je kunt alvast inloggen met je e-mailadres en wachtwoord.",
  };
}
