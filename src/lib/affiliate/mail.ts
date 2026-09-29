import { eq } from "drizzle-orm";
import { db } from "@/db";
import { affiliates } from "@/db/affiliate-schema";
import { users } from "@/db/schema";
import { verstuurMail, type MailResultaat } from "@/lib/mailtransport";
import { siteUrl } from "@/lib/site";
import { bedrijf } from "@/lib/bedrijf";
import { haalInstellingen } from "@/db/affiliate";
import { bestelmeldingAdres } from "@/lib/mail";

/**
 * Berichten aan affiliates.
 *
 * Apart van lib/mail.ts omdat dat bestand over bestellingen gaat en al
 * ruim vijfhonderd regels telt. Hier staat alleen wat een partner moet
 * weten, en dat is precies één moment dat er echt toe doet: het moment
 * waarop zijn link gaat werken.
 *
 * Bewust sobere opmaak, geen kleurvlakken en geen knoppen. Dit is post
 * tussen twee bedrijven; een nieuwsbriefachtig sjabloon maakt het minder
 * geloofwaardig, niet meer.
 */

/**
 * HTML-tekens onschadelijk maken.
 *
 * De promotietekst en de bedrijfsnaam zijn door een onbekende ingevuld.
 * Die gaan hier rechtstreeks een mail in die jij opent, dus een `<` moet
 * een `<` blijven en geen tag worden.
 */
function ontsnap(tekst: string): string {
  return tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function omhulsel(kop: string, alineas: string[]): string {
  const regels = alineas
    .map(
      (a) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#16181a">${a}</p>`,
    )
    .join("");

  return `<!doctype html><html lang="nl"><body style="margin:0;padding:24px 0;background:#e8e9e6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px">
<p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5f666b">Blusbox · partnerprogramma</p>
<h1 style="margin:8px 0 20px;font-size:22px;line-height:1.25;color:#16181a">${kop}</h1>
${regels}
<hr style="border:0;border-top:1px solid #9ba1a6;margin:28px 0 16px">
<p style="margin:0;font-size:13px;color:#5f666b">${bedrijf.volledig}</p>
<p style="margin:0;font-size:13px;color:#5f666b">${bedrijf.telefoon} · ${bedrijf.email}</p>
</div></body></html>`;
}

async function partnergegevens(affiliateId: string) {
  const [rij] = await db
    .select({
      slug: affiliates.slug,
      status: affiliates.status,
      notitie: affiliates.beheerdersnotitie,
      percentageBp: affiliates.percentageBp,
      naam: users.name,
      email: users.email,
    })
    .from(affiliates)
    .innerJoin(users, eq(users.id, affiliates.userId))
    .where(eq(affiliates.id, affiliateId))
    .limit(1);
  return rij ?? null;
}

/**
 * Melding aan de winkelier dat er een aanvraag binnen is.
 *
 * Hier zat een gat: de aanvrager kreeg netjes bericht, maar aan deze kant
 * gebeurde er niets. Een aanvraag bleef dan staan tot iemand uit zichzelf
 * het dashboard opende, en dat is precies de reden waarom een partner
 * afhaakt voordat hij begonnen is.
 *
 * Naar hetzelfde postvak als de bestelmeldingen. Een eigen variabele
 * erbij zou betekenen dat je het op twee plaatsen goed moet zetten, en de
 * tweede vergeet je.
 *
 * Alles waarop je een besluit neemt staat in de mail zelf. Zo kun je vanaf
 * je telefoon al zien of dit iemand is die je wil hebben, in plaats van
 * eerst te moeten inloggen om te ontdekken dat het spam was.
 */
export async function stuurAanvraagmeldingNaarBeheer(
  affiliateId: string,
): Promise<MailResultaat> {
  const naar = bestelmeldingAdres();
  if (!naar) {
    return { verstuurd: false, reden: "Geen adres voor meldingen ingesteld" };
  }

  const [rij] = await db
    .select({
      slug: affiliates.slug,
      bedrijfsnaam: affiliates.bedrijfsnaam,
      website: affiliates.website,
      kanalen: affiliates.kanalen,
      promotiemethode: affiliates.promotiemethode,
      landcode: affiliates.landcode,
      uitbetaalmethode: affiliates.uitbetaalmethode,
      naam: users.name,
      email: users.email,
    })
    .from(affiliates)
    .innerJoin(users, eq(users.id, affiliates.userId))
    .where(eq(affiliates.id, affiliateId))
    .limit(1);
  if (!rij) return { verstuurd: false, reden: "Affiliate niet gevonden" };

  const beheer = `${siteUrl}/dashboard/affiliates`;

  const velden: [string, string | null][] = [
    ["Naam", rij.naam],
    ["E-mail", rij.email],
    ["Bedrijf", rij.bedrijfsnaam],
    ["Link", `/r/${rij.slug}`],
    ["Website", rij.website],
    ["Kanalen", rij.kanalen],
    ["Land", rij.landcode],
    ["Uitbetaling", rij.uitbetaalmethode],
  ];
  const ingevuld = velden.filter(([, w]) => w);

  const tekst = [
    "Er is een nieuwe aanmelding voor het partnerprogramma.",
    "",
    ...ingevuld.map(([k, w]) => `${k}: ${w}`),
    "",
    "Hoe hij Blusbox wil promoten:",
    rij.promotiemethode ?? "(niets ingevuld)",
    "",
    `Goedkeuren of afwijzen: ${beheer}`,
  ].join("\n");

  return verstuurMail({
    naar,
    onderwerp: `Nieuwe partneraanvraag: ${rij.naam ?? rij.email}`,
    html: omhulsel("Nieuwe partneraanvraag", [
      `<table style="border-collapse:collapse;font-size:14px">${ingevuld
        .map(
          ([k, w]) =>
            `<tr><td style="padding:2px 14px 2px 0;color:#5f666b;vertical-align:top">${k}</td><td style="padding:2px 0;color:#16181a">${ontsnap(String(w))}</td></tr>`,
        )
        .join("")}</table>`,
      `<strong>Hoe hij Blusbox wil promoten</strong><br>${ontsnap(rij.promotiemethode ?? "(niets ingevuld)")}`,
      `Goedkeuren of afwijzen:<br><span style="font-family:ui-monospace,Menlo,monospace">${beheer}</span>`,
    ]),
    tekst,
  });
}

/** Bevestiging dat de aanmelding binnen is. */
export async function stuurAanmeldbevestiging(
  affiliateId: string,
): Promise<MailResultaat> {
  const p = await partnergegevens(affiliateId);
  if (!p) return { verstuurd: false, reden: "Affiliate niet gevonden" };

  const tekst = [
    `Hoi ${p.naam ?? ""},`.trim(),
    "",
    "Je aanmelding voor het Blusbox-partnerprogramma is binnen. Wij kijken er persoonlijk naar en laten binnen een paar werkdagen weten of je meedoet.",
    "",
    "Zodra je bent goedgekeurd staat je persoonlijke link klaar in je dashboard.",
    "",
    bedrijf.volledig,
  ].join("\n");

  return verstuurMail({
    naar: p.email,
    onderwerp: "Je aanmelding als Blusbox-partner",
    html: omhulsel("Je aanmelding is binnen", [
      `Hoi ${p.naam ?? "daar"},`,
      "Je aanmelding voor het Blusbox-partnerprogramma is binnen. Wij kijken er persoonlijk naar en laten binnen een paar werkdagen weten of je meedoet.",
      "Zodra je bent goedgekeurd staat je persoonlijke link klaar in je dashboard.",
    ]),
    tekst,
  });
}

/**
 * Bericht bij goedkeuring, met de link erin.
 *
 * De link staat voluit in de tekst en niet achter een knop: een partner
 * moet hem kunnen kopiëren, en een knop kun je niet kopiëren. Bovendien
 * is een kale, leesbare link naar het eigen domein precies het soort link
 * waar spamfilters geen bezwaar tegen hebben.
 */
export async function stuurGoedkeuring(
  affiliateId: string,
): Promise<MailResultaat> {
  const p = await partnergegevens(affiliateId);
  if (!p) return { verstuurd: false, reden: "Affiliate niet gevonden" };

  const instellingen = await haalInstellingen();
  const percentage = (
    (p.percentageBp ?? instellingen.standaardPercentageBp) / 100
  )
    .toString()
    .replace(".", ",");

  const link = `${siteUrl}/r/${p.slug}`;
  const dashboard = `${siteUrl}/affiliate/dashboard`;

  const tekst = [
    `Hoi ${p.naam ?? ""},`.trim(),
    "",
    `Je doet mee. Vanaf nu verdien je ${percentage}% over de productwaarde van elke verkoop via jouw link.`,
    "",
    `Je persoonlijke link: ${link}`,
    `Je dashboard: ${dashboard}`,
    "",
    `Deel de link waar je wil. Klikt iemand erop en bestelt hij binnen ${instellingen.attributieDagen} dagen, dan staat de commissie op jouw naam.`,
    "",
    bedrijf.volledig,
  ].join("\n");

  return verstuurMail({
    naar: p.email,
    onderwerp: "Je bent Blusbox-partner",
    html: omhulsel("Je doet mee", [
      `Hoi ${p.naam ?? "daar"},`,
      `Vanaf nu verdien je <strong>${percentage}%</strong> over de productwaarde van elke verkoop via jouw link.`,
      `Je persoonlijke link:<br><span style="font-family:ui-monospace,Menlo,monospace">${link}</span>`,
      `Deel hem waar je wil. Klikt iemand erop en bestelt hij binnen ${instellingen.attributieDagen} dagen, dan staat de commissie op jouw naam.`,
      `In je dashboard zie je klikken, verkopen en wat er klaarstaat: <span style="font-family:ui-monospace,Menlo,monospace">${dashboard}</span>`,
    ]),
    tekst,
  });
}

/** Bericht bij afwijzing of schorsing, met de reden erbij. */
export async function stuurAfwijzing(
  affiliateId: string,
): Promise<MailResultaat> {
  const p = await partnergegevens(affiliateId);
  if (!p) return { verstuurd: false, reden: "Affiliate niet gevonden" };

  const geschorst = p.status === "geschorst";
  const kop = geschorst ? "Je deelname staat stil" : "Je aanmelding is niet doorgegaan";

  // De reden hoort erbij. Een afwijzing zonder uitleg is niet te
  // weerleggen, en dat is precies waar iemand boos van wordt.
  const uitleg = p.notitie
    ? `Toelichting: ${p.notitie}`
    : "Heb je hier vragen over, stuur dan gerust een bericht terug.";

  const tekst = [
    `Hoi ${p.naam ?? ""},`.trim(),
    "",
    geschorst
      ? "Je deelname aan het Blusbox-partnerprogramma staat tijdelijk stil. Je persoonlijke link werkt op dit moment niet."
      : "We gaan niet verder met je aanmelding voor het Blusbox-partnerprogramma.",
    "",
    uitleg,
    "",
    bedrijf.volledig,
  ].join("\n");

  return verstuurMail({
    naar: p.email,
    onderwerp: geschorst ? "Je deelname staat stil" : "Over je aanmelding als Blusbox-partner",
    html: omhulsel(kop, [
      `Hoi ${p.naam ?? "daar"},`,
      geschorst
        ? "Je deelname aan het Blusbox-partnerprogramma staat tijdelijk stil. Je persoonlijke link werkt op dit moment niet."
        : "We gaan niet verder met je aanmelding voor het Blusbox-partnerprogramma.",
      uitleg,
    ]),
    tekst,
  });
}
