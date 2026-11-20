"use server";

import { geldigEmail } from "@/lib/adres";
import { bestelmeldingAdres } from "@/lib/mail";
import { verstuurMail } from "@/lib/mailtransport";
import { bedrijf } from "@/lib/bedrijf";
import { siteUrl } from "@/lib/site";
import { slaContactberichtOp } from "@/db/contact";

/**
 * Contactformulier → opslaan in de database (te lezen en beantwoorden in
 * /dashboard/berichten) én een melding naar ons eigen postvak.
 *
 * Opslaan gaat eerst. Lukt dat, dan is het bericht binnen, ook als de
 * mail daarna hapert; de bezoeker krijgt dan gewoon "verstuurd" te zien.
 * Pas als allebei mislukken krijgt hij een foutmelding.
 *
 * Er gaat met opzet geen bevestiging naar het opgegeven adres: dan kan
 * iedereen via dit formulier post namens blusbox.nl naar willekeurige
 * adressen laten sturen. "Beantwoorden" gaat via het antwoordadres naar
 * de klant, en dat is het echte antwoord.
 *
 * Spam: een verborgen veld dat mensen niet zien maar bots invullen, en een
 * minimale invultijd. Een bot die wordt tegengehouden krijgt "gelukt" te
 * zien, zodat hij niet gaat zoeken naar wat hem verraadt.
 */

export type ContactStaat =
  | { fase: "leeg" }
  | {
      fase: "fout";
      melding: string;
      velden?: Record<string, string>;
      /** Wat er was ingevuld: React leegt het formulier na elke verzending. */
      waarden?: Record<string, string>;
    }
  | { fase: "gelukt" };

const ONDERWERPEN: Record<string, string> = {
  vraag: "Vraag over het product",
  plaatsing: "Past het in mijn meterkast?",
  zakelijk: "Zakelijke offerte",
  dealer: "Dealeraccount aanvragen",
  bestelling: "Vraag over een bestelling",
};

const MIN_INVULTIJD_MS = 3000;

function ontsnap(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function stuurContactbericht(
  _vorige: ContactStaat,
  formData: FormData,
): Promise<ContactStaat> {
  const naam = String(formData.get("naam") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const sleutel = String(formData.get("onderwerp") ?? "vraag");
  const bericht = String(formData.get("bericht") ?? "").trim().slice(0, 5000);
  const lokaas = String(formData.get("website") ?? "");
  const begonnen = Number(formData.get("begonnen") ?? 0);

  if (lokaas || (begonnen && Date.now() - begonnen < MIN_INVULTIJD_MS)) {
    return { fase: "gelukt" };
  }

  const velden: Record<string, string> = {};
  const ingevuld = { naam, email, onderwerp: sleutel, bericht };
  if (!naam) velden.naam = "Vul je naam in.";
  if (!geldigEmail(email)) velden.email = "Vul een geldig e-mailadres in, dan kunnen we je antwoorden.";
  if (bericht.length < 5) velden.bericht = "Schrijf je vraag of bericht.";
  if (Object.keys(velden).length > 0) {
    return {
      fase: "fout",
      melding: "Controleer de ingevulde gegevens.",
      velden,
      waarden: ingevuld,
    };
  }

  const onderwerp = ONDERWERPEN[sleutel] ?? ONDERWERPEN.vraag;
  const naar = bestelmeldingAdres() ?? bedrijf.email;

  let berichtId: string | null = null;
  try {
    berichtId = await slaContactberichtOp({ naam, email, onderwerp, bericht });
  } catch (fout) {
    console.error("Contactbericht niet opgeslagen:", fout);
  }
  const link = berichtId ? `${siteUrl}/dashboard/berichten/${berichtId}` : null;

  const resultaat = await verstuurMail({
    naar,
    antwoordNaar: email,
    onderwerp: `Contact · ${onderwerp} · ${naam}`,
    tekst: [
      `Via het contactformulier op blusbox.nl`,
      `Naam: ${naam}`,
      `E-mail: ${email}`,
      `Onderwerp: ${onderwerp}`,
      "",
      bericht,
      "",
      link
        ? `Beantwoorden vanaf info@blusbox.nl: ${link}`
        : "Beantwoorden gaat rechtstreeks naar de klant.",
    ].join("\n"),
    html: `<p style="color:#666;font-size:13px">Via het contactformulier op blusbox.nl</p>
<p><strong>Naam:</strong> ${ontsnap(naam)}<br><strong>E-mail:</strong> ${ontsnap(email)}<br><strong>Onderwerp:</strong> ${ontsnap(onderwerp)}</p>
<p style="white-space:pre-wrap">${ontsnap(bericht)}</p>
<p style="color:#666;font-size:13px">${
      link
        ? `<a href="${link}">Lees en beantwoord in het beheer</a> (vanaf info@blusbox.nl), of beantwoord deze mail rechtstreeks.`
        : "Beantwoorden gaat rechtstreeks naar de klant."
    }</p>`,
  });

  if (!resultaat.verstuurd) {
    console.error(`Contactbericht niet verstuurd: ${resultaat.reden}`);
    // Opgeslagen is genoeg: dan staat het in het beheer.
    if (berichtId) return { fase: "gelukt" };
    return {
      fase: "fout",
      melding: `Versturen lukte niet. Mail je vraag naar ${bedrijf.email}, dan helpen we je zo snel mogelijk.`,
      waarden: ingevuld,
    };
  }
  return { fase: "gelukt" };
}
