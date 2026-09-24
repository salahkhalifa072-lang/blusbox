"use server";

import { revalidatePath } from "next/cache";
import { vereisDashboard } from "@/lib/sessie";
import { magFactureren, vereis } from "@/lib/rollen";
import {
  FactuurGeweigerd,
  maakBalieFactuur,
  type BalieFactuurInvoer,
} from "@/db/facturen";
import { stuurFactuur, stuurFactuurKopie } from "@/lib/mail";
import { verzendadres } from "@/lib/bedrijf";
import {
  geldigEmail,
  geldigHuisnummer,
  geldigePostcode,
  normaliseerPostcode,
} from "@/lib/adres";
import { catalogus } from "@/lib/catalogus";
import { euro } from "@/lib/pricing";
import { datumNl, leesBedrag } from "@/lib/factuur";

export type FactuurStaat =
  | { fase: "leeg" }
  | {
      fase: "fout";
      melding: string;
      velden?: Record<string, string>;
      /** Wat er was ingevuld, zodat een typfout niet het hele formulier wist */
      waarden?: Record<string, string>;
    }
  | { fase: "klaar"; melding: string; factuurnummer: string };

/**
 * Balieverkoop vastleggen en de factuur mailen.
 *
 * Alleen admin: een factuur is een financieel document met een doorlopend
 * nummer, en dit is het enige formulier in het dashboard met een vrij
 * e-mailadres. Dat adres wordt niet los gebruikt maar aan een nieuwe
 * bestelling gehangen, en de mail zelf is een vast sjabloon — dus ook
 * hiermee kun je geen willekeurige post namens blusbox.nl versturen.
 */
export async function maakEnVerstuurFactuur(
  _vorige: FactuurStaat,
  formData: FormData,
): Promise<FactuurStaat> {
  const actor = await vereisDashboard();
  vereis(magFactureren(actor.rol), "facturen maken");

  const lees = (k: string) => String(formData.get(k) ?? "").trim();
  const velden: Record<string, string> = {};
  const waarden: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) waarden[k] = v;
  }

  const klantNaam = lees("klantNaam");
  const email = lees("email");
  const straat = lees("straat");
  const huisnummer = lees("huisnummer");
  const postcode = lees("postcode");
  const plaats = lees("plaats");
  const leverdatum = lees("leverdatum");

  if (!klantNaam) velden.klantNaam = "Vul de naam in.";
  if (!geldigEmail(email)) velden.email = "Vul een geldig e-mailadres in.";
  if (!straat) velden.straat = "Vul de straat in.";
  if (!geldigHuisnummer(huisnummer)) velden.huisnummer = "Vul een huisnummer in.";
  if (!geldigePostcode(postcode, "NL")) velden.postcode = "Vul een geldige postcode in.";
  if (!plaats) velden.plaats = "Vul de plaats in.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(leverdatum)) {
    velden.leverdatum = "Kies de datum van de verkoop.";
  } else if (leverdatum > datumNl()) {
    velden.leverdatum = "De leverdatum ligt in de toekomst.";
  }

  const regels: BalieFactuurInvoer["regels"] = [];
  for (const item of catalogus.filter((c) => c.actief)) {
    const aantalRuw = lees(`aantal-${item.slug}`) || "0";
    const aantal = Number(aantalRuw);
    if (!Number.isInteger(aantal) || aantal < 0 || aantal > 500) {
      velden[`aantal-${item.slug}`] = "Vul een heel aantal in.";
      continue;
    }
    if (aantal === 0) continue;
    const prijs = leesBedrag(lees(`prijs-${item.slug}`));
    if (prijs === null || prijs <= 0) {
      velden[`prijs-${item.slug}`] = "Vul een prijs in, bijvoorbeeld 29,99.";
      continue;
    }
    regels.push({ slug: item.slug, aantal, stukprijsInclBtwCenten: prijs });
  }
  if (regels.length === 0 && Object.keys(velden).length === 0) {
    return {
      fase: "fout",
      melding: "Vul bij minstens één artikel een aantal in.",
      waarden,
    };
  }
  if (Object.keys(velden).length > 0) {
    return {
      fase: "fout",
      melding: "Controleer de gemarkeerde velden.",
      velden,
      waarden,
    };
  }

  // Vóór het aanmaken, niet pas bij het mailen: anders ligt er een
  // factuurnummer vast voor een factuur die niet gemaakt kan worden, en
  // dat is een gat in de reeks.
  if (!verzendadres()) {
    return {
      fase: "fout",
      waarden,
      melding:
        "Het vestigingsadres ontbreekt in de instellingen (VERZEND_STRAAT, VERZEND_HUISNUMMER, VERZEND_POSTCODE, VERZEND_PLAATS in Vercel). Dat moet wettelijk op de factuur.",
    };
  }

  let factuur;
  try {
    factuur = await maakBalieFactuur({
      klantNaam,
      bedrijfsnaam: lees("bedrijfsnaam") || undefined,
      email,
      straat,
      huisnummer,
      postcode: normaliseerPostcode(postcode, "NL"),
      plaats,
      leverdatum,
      regels,
    });
  } catch (fout) {
    if (fout instanceof FactuurGeweigerd) {
      return { fase: "fout", melding: fout.message, waarden };
    }
    throw fout;
  }

  revalidatePath("/dashboard/facturen");
  revalidatePath("/dashboard/bestellingen");

  const mail = await stuurFactuur(factuur.factuurnummer);
  if (!mail.verstuurd) {
    return {
      fase: "klaar",
      factuurnummer: factuur.factuurnummer,
      melding: `Factuur ${factuur.factuurnummer} is aangemaakt, maar de mail ging niet weg: ${mail.reden}. Probeer het opnieuw vanuit de lijst.`,
    };
  }

  await stuurKopie(factuur.factuurnummer);

  return {
    fase: "klaar",
    factuurnummer: factuur.factuurnummer,
    melding: `Factuur ${factuur.factuurnummer} (${euro(factuur.totaalInclBtwCenten)}) is verstuurd aan ${email}.`,
  };
}

/** Kopie voor de eigen administratie; mislukken is geen fout voor de klant. */
async function stuurKopie(factuurnummer: string) {
  const kopie = await stuurFactuurKopie(factuurnummer);
  if (!kopie.verstuurd) {
    console.error(`Kopie van factuur ${factuurnummer} niet verstuurd: ${kopie.reden}`);
  }
}

export type OpnieuwStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

/** Nogmaals versturen, altijd naar het adres dat bij de factuur hoort. */
export async function verstuurFactuurOpnieuw(
  _vorige: OpnieuwStaat,
  formData: FormData,
): Promise<OpnieuwStaat> {
  const actor = await vereisDashboard();
  vereis(magFactureren(actor.rol), "facturen versturen");

  const factuurnummer = String(formData.get("factuurnummer") ?? "").trim();
  if (!factuurnummer) return { fase: "fout", melding: "Geen factuur gekozen." };

  const mail = await stuurFactuur(factuurnummer);
  return mail.verstuurd
    ? { fase: "klaar", melding: "Opnieuw verstuurd." }
    : { fase: "fout", melding: `Niet verstuurd: ${mail.reden}` };
}
