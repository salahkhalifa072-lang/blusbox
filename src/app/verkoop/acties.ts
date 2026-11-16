"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { vereisVerkoper } from "@/lib/sessie";
import {
  DeurverkoopGeweigerd,
  annuleerDeurverkoop,
  haalDeurverkoop,
  koppelDeurSessie,
  maakDeurverkoop,
} from "@/db/deurverkoop";
import { geldigEmail, geldigHuisnummer, geldigePostcode, normaliseerPostcode } from "@/lib/adres";
import { verzendadres } from "@/lib/bedrijf";
import { laatSessieVerlopen, maakCheckoutSessie, stripeBeschikbaar } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";
import { DEUR_ARTIKELEN, MAX_DEURKORTING_PROCENT, pasKortingToe } from "./artikelen";
import { leesBedrag } from "@/lib/factuur";

export type VerkoopStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string; velden?: Record<string, string>; waarden?: Record<string, string> };

/**
 * Nieuwe verkoop aan de deur: klantgegevens vastleggen en meteen een
 * betaalpagina klaarzetten. Daarna door naar het betaalscherm met de
 * QR-code. Er wordt hier niets gemaild; dat gebeurt pas als Stripe meldt
 * dat er betaald is.
 */
export async function startDeurverkoop(_vorige: VerkoopStaat, formData: FormData): Promise<VerkoopStaat> {
  const actor = await vereisVerkoper();
  const lees = (k: string) => String(formData.get(k) ?? "").trim();
  const waarden: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$")) waarden[k] = v;

  const velden: Record<string, string> = {};
  const klantNaam = lees("klantNaam");
  const email = lees("email").toLowerCase();
  const straat = lees("straat");
  const huisnummer = lees("huisnummer");
  const postcode = lees("postcode");
  const plaats = lees("plaats");
  if (!klantNaam) velden.klantNaam = "Vul de naam van de klant in.";
  if (!geldigEmail(email)) velden.email = "Vul een geldig e-mailadres in; daar gaat de factuur heen.";
  if (!straat) velden.straat = "Vul de straat in.";
  if (!geldigHuisnummer(huisnummer)) velden.huisnummer = "Vul het huisnummer in.";
  if (!geldigePostcode(postcode, "NL")) velden.postcode = "Vul een geldige postcode in.";
  if (!plaats) velden.plaats = "Vul de plaats in.";
  if (formData.get("bedenktijd") !== "ja") {
    velden.bedenktijd = "Vertel de klant over de 14 dagen bedenktijd en vink dit aan.";
  }

  const volleRegels = DEUR_ARTIKELEN.flatMap((a) => {
    const aantal = Number(lees(`aantal-${a.slug}`) || "0");
    if (!Number.isInteger(aantal) || aantal < 0 || aantal > 50) {
      velden[`aantal-${a.slug}`] = "Kies een aantal tussen 0 en 50.";
      return [];
    }
    return aantal > 0 ? [{ slug: a.slug, aantal, stukprijsInclBtwCenten: a.prijsInclBtwCenten }] : [];
  });
  if (volleRegels.length === 0 && !velden["aantal-blusbox"]) velden["aantal-blusbox"] = "Kies minstens één artikel.";

  // Korting in euro's, met een grens voor verkopers.
  const kortingRuw = lees("korting");
  const gevraagd = kortingRuw ? leesBedrag(kortingRuw) : 0;
  const vol = volleRegels.reduce((t, r) => t + r.stukprijsInclBtwCenten * r.aantal, 0);
  if (gevraagd === null || gevraagd < 0) {
    velden.korting = "Vul de korting in als bedrag, bijvoorbeeld 5 of 7,50.";
  } else if (vol > 0 && gevraagd >= vol) {
    velden.korting = "De korting is hoger dan het totaal.";
  } else if (actor.rol !== "admin" && gevraagd * 100 > vol * MAX_DEURKORTING_PROCENT) {
    velden.korting = `Je kunt maximaal ${MAX_DEURKORTING_PROCENT}% korting geven (${(Math.floor((vol * MAX_DEURKORTING_PROCENT) / 100) / 100).toFixed(2).replace(".", ",")} euro).`;
  }
  const { regels, kortingCenten } = pasKortingToe(volleRegels, gevraagd ?? 0);

  if (Object.keys(velden).length > 0) {
    return { fase: "fout", melding: "Controleer de gemarkeerde velden.", velden, waarden };
  }
  if (!stripeBeschikbaar()) return { fase: "fout", melding: "Betalen is nog niet ingesteld (Stripe).", waarden };
  // Zonder vestigingsadres kan er na de betaling geen factuur worden
  // gemaakt; dan liever nu stoppen dan straks een betaalde klant zonder factuur.
  if (!verzendadres()) {
    return { fase: "fout", melding: "Het vestigingsadres voor de factuur ontbreekt in de instellingen. Neem contact op met de beheerder.", waarden };
  }

  let ordernummer: string;
  try {
    const verkoop = await maakDeurverkoop({
      verkoperId: actor.id,
      klantNaam,
      bedrijfsnaam: lees("bedrijfsnaam") || undefined,
      email,
      straat,
      huisnummer,
      postcode: normaliseerPostcode(postcode, "NL"),
      plaats,
      regels,
      kortingCenten,
    });
    ordernummer = verkoop.ordernummer;
    await nieuweSessie(verkoop.orderId, ordernummer, email, regels);
  } catch (fout) {
    if (fout instanceof DeurverkoopGeweigerd) return { fase: "fout", melding: fout.message, waarden };
    console.error("Deurverkoop starten mislukt:", fout);
    return { fase: "fout", melding: "Er ging iets mis bij het klaarzetten van de betaling. Probeer het opnieuw.", waarden };
  }

  revalidatePath("/verkoop");
  redirect(`/verkoop/${ordernummer}`);
}

async function nieuweSessie(
  orderId: string,
  ordernummer: string,
  email: string | null,
  regels: { slug: string; aantal: number; stukprijsInclBtwCenten: number }[],
) {
  const sessie = await maakCheckoutSessie({
    regels: regels.map((r) => ({
      naam: DEUR_ARTIKELEN.find((a) => a.slug === r.slug)?.naam ?? r.slug,
      stukprijsCenten: r.stukprijsInclBtwCenten,
      aantal: r.aantal,
    })),
    email: email ?? undefined,
    ordernummer,
    orderId,
    succesUrl: `${siteUrl}/betaald`,
    annuleerUrl: `${siteUrl}/betaald?afgebroken=1`,
    bron: "deur",
  });
  if (!(await koppelDeurSessie(orderId, sessie.id))) await laatSessieVerlopen(sessie.id);
}

/** Voor het betaalscherm: is er al betaald? */
export async function deurverkoopStatus(ordernummer: string) {
  const actor = await vereisVerkoper();
  const v = await haalDeurverkoop(ordernummer, actor);
  if (!v) return null;
  return { status: v.status, factuurnummer: v.factuurnummer, email: v.email };
}

/**
 * Nieuwe betaalpagina, bijvoorbeeld als de klant de vorige wegklikte. De
 * oude wordt eerst gesloten, zodat er nooit twee open staan.
 */
export async function vernieuwBetaling(formData: FormData) {
  const actor = await vereisVerkoper();
  const ordernummer = String(formData.get("ordernummer") ?? "");
  const v = await haalDeurverkoop(ordernummer, actor);
  if (!v || v.status !== "nieuw") redirect(`/verkoop/${ordernummer}`);
  if (v.stripeSessie) await laatSessieVerlopen(v.stripeSessie);
  const regels = v.regels.map((r) => {
    const a = DEUR_ARTIKELEN.find((x) => x.naam === r.naam);
    return { slug: a?.slug ?? r.naam, aantal: r.aantal, stukprijsInclBtwCenten: Math.round(r.regelInclBtwCenten / r.aantal) };
  });
  await nieuweSessie(v.orderId, v.ordernummer, v.email, regels);
  redirect(`/verkoop/${ordernummer}`);
}

/** De klant ziet ervan af: annuleren, alleen zolang er niet betaald is. */
export async function annuleerVerkoop(formData: FormData) {
  const actor = await vereisVerkoper();
  const ordernummer = String(formData.get("ordernummer") ?? "");
  const v = await haalDeurverkoop(ordernummer, actor);
  if (v && v.status === "nieuw") {
    if (v.stripeSessie) await laatSessieVerlopen(v.stripeSessie);
    await annuleerDeurverkoop(v.orderId);
  }
  revalidatePath("/verkoop");
  redirect("/verkoop");
}
