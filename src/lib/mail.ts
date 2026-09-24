import { render } from "@react-email/components";
import { Bestelbevestiging } from "@/emails/bestelbevestiging";
import { Bestelmelding } from "@/emails/bestelmelding";
import { Klantbericht } from "@/emails/klantbericht";
import { Berichtkopie } from "@/emails/berichtkopie";
import { Terugroepbericht } from "@/emails/terugroepbericht";
import { Vervangingsherinnering } from "@/emails/vervangingsherinnering";
import { Verzendbericht } from "@/emails/verzendbericht";
import { Bezorgbericht } from "@/emails/bezorgbericht";
import { Factuurbericht } from "@/emails/factuurbericht";
import { haalFactuur, type Factuur } from "@/db/facturen";
import { maakFactuurPdf, vervaldatum } from "./factuur";
import { maakHerroepingsformulier } from "./herroepingsformulier";
import { euro, verzendwaarde } from "./pricing";
import { formatteerNl, herroepingUiterlijk } from "./levensduur";
import { siteUrl } from "./site";
import { bedrijf, verzendadres } from "./bedrijf";
import { haalBestelling } from "./bestelling";
import { contactadresVanBestelling } from "@/db/queries";
import {
  MailNietGeconfigureerd,
  mailBeschikbaar,
  verstuurMail,
  type MailResultaat,
} from "./mailtransport";

export { MailNietGeconfigureerd, mailBeschikbaar };
export type { MailResultaat };

/**
 * Transactional mail (§3).
 *
 * Sending must never break a payment. The webhook that calls this has
 * already taken the customer's money and marked the order paid; if the
 * mail fails, that is a problem to log and retry, not a reason to return
 * 500 and have Stripe replay the whole event.
 */


/**
 * Order confirmation with the statutory withdrawal form attached.
 * Returns a result rather than throwing, so callers can log and move on.
 */
export async function stuurBestelbevestiging(
  ordernummer: string,
  ontvanger?: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const gegevens = await haalBestelling(ordernummer);
  if (!gegevens) {
    return { verstuurd: false, reden: `Bestelling ${ordernummer} niet gevonden` };
  }

  const { order, regels } = gegevens;
  // Stripe geeft normaal het adres mee; valt dat weg, dan is de resolver het
  // vangnet — anders krijgt een ingelogde klant helemaal niets.
  const naar = ontvanger ?? (await contactadresVanBestelling(ordernummer));
  if (!naar) {
    return { verstuurd: false, reden: "Geen e-mailadres bij deze bestelling" };
  }

  // The withdrawal period runs from delivery; before that we can only
  // state it from today, which is what the mail says.
  const start = (order.geleverdOp ?? order.geplaatstOp)
    .toISOString()
    .slice(0, 10);

  const html = await render(
    Bestelbevestiging({
      ordernummer: order.ordernummer,
      regels: regels.map((r) => ({
        naam: r.naam,
        aantal: r.aantal,
        regelBedrag: euro(r.stukprijsExclBtwCenten * r.aantal),
      })),
      subtotaal: euro(order.subtotaalExclBtwCenten),
      btw: order.btwVerlegd ? "btw verlegd" : euro(order.btwBedragCenten),
      verzendwaarde,
      totaal: euro(order.totaalInclBtwCenten),
      adres: [
        [order.straat, order.huisnummer].filter(Boolean).join(" "),
        [order.postcode, order.plaats].filter(Boolean).join("  "),
        order.landcode,
      ].filter(Boolean),
      herroepingUiterlijk: formatteerNl(herroepingUiterlijk(start)),
      siteUrl,
    }),
  );

  const formulier = await maakHerroepingsformulier();

  return verstuurMail({
    naar,
    onderwerp: `Bestelling ${order.ordernummer} bevestigd — Blusbox`,
    html,
    bijlagen: [
      {
        filename: "modelformulier-herroeping-blusbox.pdf",
        content: Buffer.from(formulier).toString("base64"),
      },
    ],
  });
}

/**
 * Waar de bestelmeldingen heen gaan.
 *
 * Eigen variabele en niet MAIL_CONTACT, omdat dit twee verschillende dingen
 * zijn: MAIL_CONTACT is het adres dat klanten zien en gebruiken, dit is het
 * postvak waar de winkelier zijn bestellingen wil binnenkrijgen. Die mogen
 * uit elkaar lopen, en bij Blusbox doen ze dat ook.
 */
export function bestelmeldingAdres(): string | undefined {
  return (
    process.env.MAIL_BESTELLINGEN ??
    process.env.MAIL_CONTACT ??
    undefined
  );
}

/**
 * Bestelmelding naar de winkelier.
 *
 * Los van de bestelbevestiging gehouden, en met opzet. Er zijn twee
 * ontvangers met twee verschillende belangen: de klant wil een bewijs van
 * zijn aankoop met het herroepingsformulier erbij, de winkelier wil een
 * werkopdracht. Eén mail met een bcc erop zou betekenen dat de winkelier
 * het klantendocument krijgt en de klant het interne adres ziet staan.
 *
 * Belangrijker nog: als de klantmail struikelt — verkeerd adres, bounce,
 * een fout in het pdf'je — mag dat er nooit toe leiden dat de winkelier
 * niets hoort. Daarom roept de webhook ze apart aan en telt een mislukking
 * van de een niet mee voor de ander.
 */
export async function stuurBestelmelding(
  ordernummer: string,
  klantEmail?: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const naar = bestelmeldingAdres();
  if (!naar) {
    return { verstuurd: false, reden: "MAIL_BESTELLINGEN ontbreekt" };
  }

  const gegevens = await haalBestelling(ordernummer);
  if (!gegevens) {
    return { verstuurd: false, reden: `Bestelling ${ordernummer} niet gevonden` };
  }

  const { order, regels } = gegevens;
  const klant =
    klantEmail ?? (await contactadresVanBestelling(ordernummer)) ?? "onbekend";
  // Naam vóór het adres: dat is de volgorde waarin je een label leest.
  const naam = order.klantNaam?.trim();

  const adres = [
    naam,
    [order.straat, order.huisnummer].filter(Boolean).join(" "),
    [order.postcode, order.plaats].filter(Boolean).join("  "),
    order.landcode,
  ].filter(Boolean) as string[];

  const html = await render(
    Bestelmelding({
      ordernummer: order.ordernummer,
      klantEmail: klant,
      regels: regels.map((r) => ({
        naam: r.naam,
        aantal: r.aantal,
        regelBedrag: euro(r.stukprijsExclBtwCenten * r.aantal),
      })),
      subtotaal: euro(order.subtotaalExclBtwCenten),
      btw: order.btwVerlegd ? "btw verlegd" : euro(order.btwBedragCenten),
      verzendwaarde,
      totaal: euro(order.totaalInclBtwCenten),
      adres,
      geplaatstOp: formatteerNl(order.geplaatstOp.toISOString().slice(0, 10)),
      siteUrl,
    }),
  );

  const aantalTotaal = regels.reduce((som, r) => som + r.aantal, 0);

  // Platte tekst met dezelfde feiten: dit is de versie die een telefoon in
  // de meldingsregel laat zien, en spamfilters rekenen een bericht zonder
  // tekstdeel aan.
  const tekst = [
    `Nieuwe bestelling ${order.ordernummer}`,
    `Totaal ${euro(order.totaalInclBtwCenten)} — ${aantalTotaal} stuks`,
    `Klant: ${klant}`,
    "",
    ...regels.map((r) => `${r.aantal}x ${r.naam}`),
    "",
    "Bezorgadres:",
    ...adres,
  ].join("\n");

  return verstuurMail({
    naar,
    onderwerp: `Bestelling ${order.ordernummer} — ${euro(order.totaalInclBtwCenten)} — ${aantalTotaal} stuks`,
    html,
    tekst,
    // Beantwoorden komt bij de klant uit, niet bij ons eigen postvak.
    antwoordNaar: klant !== "onbekend" ? klant : undefined,
  });
}

/**
 * Een zelfgeschreven bericht van de winkelier aan één klant.
 *
 * De reden dat dit hier staat en niet in een los mailprogramma: de mail
 * moet van info@blusbox.nl komen, en dat adres is alleen geverifieerd bij
 * MailerSend. Vanuit een gewone Gmail versturen namens dat adres kan pas
 * na het instellen van SMTP-toegang, en dan nog gaat elke verzending
 * buiten de administratie om. Hier loopt het door dezelfde afzender en
 * dezelfde controles als de rest.
 *
 * Bewust géén ontvangerveld: het adres komt uit de bestelling. Een vrij
 * invulbaar "aan" zou van het dashboard een verzendmachine maken waarmee
 * iemand met toegang post namens blusbox.nl de wereld in kan sturen.
 */
export async function stuurBerichtAanKlant(
  ordernummer: string,
  onderwerp: string,
  bericht: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const schoonOnderwerp = onderwerp.trim();
  const schoonBericht = bericht.trim();
  if (!schoonOnderwerp) return { verstuurd: false, reden: "Geen onderwerp" };
  if (!schoonBericht) return { verstuurd: false, reden: "Geen bericht" };

  const naar = await contactadresVanBestelling(ordernummer);
  if (!naar) {
    return { verstuurd: false, reden: "Geen e-mailadres bij deze bestelling" };
  }

  const html = await render(
    Klantbericht({
      ordernummer,
      bericht: schoonBericht,
      siteUrl,
      bedrijf: {
        volledig: bedrijf.volledig,
        kvk: bedrijf.kvk,
        telefoon: bedrijf.telefoon,
        email: bedrijf.email,
      },
    }),
  );

  // Tekstversie met dezelfde inhoud. Zonder tekstdeel rekenen spamfilters
  // een bericht aan, en juist deze mail moet aankomen.
  const tekst = [
    `Bericht over je bestelling ${ordernummer}`,
    "",
    schoonBericht,
    "",
    "—",
    bedrijf.volledig,
    `${bedrijf.telefoon} · ${bedrijf.email}`,
  ].join("\n");

  return verstuurMail({
    naar,
    onderwerp: schoonOnderwerp,
    html,
    tekst,
  });
}

/**
 * Kopie voor de winkelier van wat er zojuist naar een klant ging.
 *
 * Een losse verzending en met opzet geen bcc op de klantmail. Een
 * bcc-adres reist mee in de kop van het bericht dat de klant ontvangt:
 * sommige clients tonen het, en bij doorsturen ligt het helemaal open.
 * Twee mails houden het gescheiden, en dat is precies de bedoeling —
 * de klant hoort niet te zien dat er meegelezen wordt.
 *
 * Mislukt deze kopie, dan is dat vervelend maar niet ernstig: de klant
 * heeft zijn bericht. De aanroeper meldt het apart en laat de verzending
 * naar de klant met rust.
 */
export async function stuurBerichtkopie(
  ordernummer: string,
  klantEmail: string,
  onderwerp: string,
  bericht: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const naar = bestelmeldingAdres();
  if (!naar) {
    return { verstuurd: false, reden: "MAIL_BESTELLINGEN ontbreekt" };
  }

  const nu = new Date();
  const verstuurdOp = `${formatteerNl(nu.toISOString().slice(0, 10))} ${nu
    .toISOString()
    .slice(11, 16)} UTC`;

  const html = await render(
    Berichtkopie({ ordernummer, klantEmail, onderwerp, bericht, verstuurdOp }),
  );

  const tekst = [
    `Kopie voor jezelf — niet naar de klant.`,
    `Verstuurd aan ${klantEmail}`,
    `Bestelling ${ordernummer}`,
    `Onderwerp: ${onderwerp}`,
    `Verstuurd op ${verstuurdOp}`,
    "",
    "Dit kreeg de klant te lezen:",
    "",
    bericht,
  ].join("\n");

  return verstuurMail({
    naar,
    onderwerp: `Kopie · ${klantEmail} · ${onderwerp}`,
    html,
    tekst,
    // Beantwoorden gaat naar de klant, niet naar je eigen postvak.
    antwoordNaar: klantEmail,
  });
}

/**
 * §9.2 recall notice for one recipient.
 *
 * Kept per-recipient on purpose. Bcc'ing the whole affected list would leak
 * every customer's address to every other customer, and a single bounce
 * would take the entire batch with it. The caller loops and records the
 * outcome per notice, so one bad address costs one notice.
 */
export async function stuurTerugroepbericht(opdracht: {
  noticeId: string;
  email: string;
  lotNummer: string;
  reden: string;
}): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const html = await render(
    Terugroepbericht({
      lotNummer: opdracht.lotNummer,
      reden: opdracht.reden,
      bevestigUrl: `${siteUrl}/terugroep/${opdracht.noticeId}`,
      siteUrl,
      contactEmail: process.env.MAIL_CONTACT ?? "info@blusbox.nl",
      telefoon: process.env.CONTACT_TELEFOON || undefined,
    }),
  );

  return verstuurMail({
    naar: opdracht.email,
    // Geen "Blusbox" vooraan: in een volle inbox moet het eerste woord al
    // duidelijk maken dat dit geen nieuwsbrief is.
    onderwerp: `Veiligheidswaarschuwing: vervang je Blusbox (lot ${opdracht.lotNummer})`,
    html,
    headers: {
      // Een terugroepbericht is geen bulkmail. Deze vlaggen houden het uit
      // filters die "list mail" naar het tabblad Reclame duwen.
      "X-Entity-Ref-ID": opdracht.noticeId,
      Importance: "high",
      Priority: "urgent",
    },
  });
}

/**
 * §9.3 vervangingsherinnering, één per unit.
 *
 * Net als bij de terugroepberichten: per ontvanger, en de aanroeper stempelt
 * pas ná een geslaagde verzending.
 */
export async function stuurVervangingsherinnering(opdracht: {
  email: string;
  maanden: 12 | 6 | 1;
  vervaldatum: string;
  installatiedatum: string;
  lotNummer: string;
}): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const html = await render(
    Vervangingsherinnering({
      maanden: opdracht.maanden,
      vervaldatum: formatteerNl(opdracht.vervaldatum),
      installatiedatum: formatteerNl(opdracht.installatiedatum),
      lotNummer: opdracht.lotNummer,
      siteUrl,
      contactEmail: process.env.MAIL_CONTACT ?? "info@blusbox.nl",
    }),
  );

  const onderwerp =
    opdracht.maanden === 1
      ? "Je Blusbox verloopt volgende maand"
      : opdracht.maanden === 6
        ? "Je Blusbox verloopt over een half jaar"
        : "Je Blusbox verloopt over een jaar";

  return verstuurMail({
    naar: opdracht.email,
    onderwerp,
    html,
  });
}

/** Adresregels zoals ze in de mail moeten staan. */
function adresRegels(order: {
  straat: string | null;
  huisnummer: string | null;
  postcode: string | null;
  plaats: string | null;
  landcode: string;
}): string[] {
  return [
    [order.straat, order.huisnummer].filter(Boolean).join(" "),
    [order.postcode, order.plaats].filter(Boolean).join("  "),
    order.landcode,
  ].filter(Boolean);
}

/**
 * §8 verzendbericht. De bestelbevestiging belooft dit met zoveel woorden:
 * "zodra het pakket onderweg is, laten we het weten".
 */
export async function stuurVerzendbericht(
  ordernummer: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const gegevens = await haalBestelling(ordernummer);
  if (!gegevens) {
    return { verstuurd: false, reden: `Bestelling ${ordernummer} niet gevonden` };
  }
  const { order } = gegevens;
  const naar = await contactadresVanBestelling(ordernummer);
  if (!naar) {
    return { verstuurd: false, reden: "Geen e-mailadres bij deze bestelling" };
  }

  const html = await render(
    Verzendbericht({
      ordernummer: order.ordernummer,
      adres: adresRegels(order),
      trackAndTrace: order.trackAndTrace ?? undefined,
      siteUrl,
    }),
  );

  return verstuurMail({
    naar: naar,
    onderwerp: `Je Blusbox is onderweg — ${order.ordernummer}`,
    html,
  });
}

/**
 * §8 bezorgbericht. Legt de einddatum van de bedenktijd vast — die loopt
 * vanaf ontvangst, dus pas nu is die datum bekend.
 */
export async function stuurBezorgbericht(
  ordernummer: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const gegevens = await haalBestelling(ordernummer);
  if (!gegevens) {
    return { verstuurd: false, reden: `Bestelling ${ordernummer} niet gevonden` };
  }
  const { order } = gegevens;
  const naar = await contactadresVanBestelling(ordernummer);
  if (!naar) {
    return { verstuurd: false, reden: "Geen e-mailadres bij deze bestelling" };
  }

  const geleverd = (order.geleverdOp ?? new Date()).toISOString().slice(0, 10);

  const html = await render(
    Bezorgbericht({
      ordernummer: order.ordernummer,
      herroepingUiterlijk: formatteerNl(herroepingUiterlijk(geleverd)),
      siteUrl,
    }),
  );

  return verstuurMail({
    naar: naar,
    onderwerp: `Je Blusbox is bezorgd — ${order.ordernummer}`,
    html,
  });
}

/*
 * Hier stond `stuurInloglink`, voor de magic-link-provider in auth.ts.
 * Beide zijn op 7 september 2026 verwijderd — zie de toelichting bij
 * `providers` in auth.ts. Alle overgebleven post is transactioneel en
 * bevat bewust géén links, alleen het contactadres.
 */

/** De link in de factuurmail. Naar onze eigen pagina, niet naar Stripe. */
export function betaalUrl(betaaltoken: string): string {
  return `${siteUrl}/betalen/${betaaltoken}`;
}

/**
 * De factuur als pdf, of een reden waarom dat niet kan.
 *
 * Zonder vestigingsadres geen factuur: art. 35a Wet OB eist het, en een
 * factuur zonder adres is voor een zakelijke klant waardeloos. Het adres
 * komt uit dezelfde VERZEND_*-variabelen als de verzendlabels, zodat het
 * niet in deze openbare repository hoeft te staan.
 */
export async function factuurPdf(
  factuur: Factuur,
): Promise<{ pdf: Uint8Array } | { fout: string }> {
  const leverancier = verzendadres();
  if (!leverancier) {
    return {
      fout: "Vestigingsadres ontbreekt (VERZEND_STRAAT, VERZEND_HUISNUMMER, VERZEND_POSTCODE, VERZEND_PLAATS). Dat moet wettelijk op de factuur.",
    };
  }
  const betaald = factuur.status !== "nieuw";
  try {
    return { pdf: await maakPdf(factuur, leverancier, betaald) };
  } catch (fout) {
    console.error(`Pdf van factuur ${factuur.factuurnummer} mislukt:`, fout);
    return { fout: `De pdf kon niet worden gemaakt: ${(fout as Error).message}` };
  }
}

function maakPdf(
  factuur: Factuur,
  leverancier: NonNullable<ReturnType<typeof verzendadres>>,
  betaald: boolean,
) {
  return maakFactuurPdf({
    factuurnummer: factuur.factuurnummer,
    ordernummer: factuur.ordernummer,
    factuurdatum: factuur.factuurdatum,
    leverdatum: factuur.leverdatum,
    leverancier,
    klant: { ...factuur, naam: factuur.klantNaam },
    totalen: factuur.totalen,
    betaald,
    betaalUrl:
      !betaald && factuur.betaaltoken
        ? betaalUrl(factuur.betaaltoken)
        : undefined,
  });
}

/**
 * Factuur van een balieverkoop naar de klant, met de pdf erbij.
 *
 * Net als bij het klantbericht is er geen vrij "aan"-veld: het adres komt
 * uit de bestelling die bij deze factuur is aangemaakt. Opnieuw versturen
 * gaat dus altijd naar hetzelfde adres.
 */
export async function stuurFactuur(
  factuurnummer: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const factuur = await haalFactuur({ factuurnummer });
  if (!factuur) {
    return { verstuurd: false, reden: `Factuur ${factuurnummer} niet gevonden` };
  }
  if (!factuur.email) {
    return { verstuurd: false, reden: "Geen e-mailadres bij deze factuur" };
  }
  if (factuur.status !== "nieuw") {
    return { verstuurd: false, reden: "Deze factuur is al betaald" };
  }
  if (!factuur.betaaltoken) {
    return { verstuurd: false, reden: "Geen betaallink bij deze factuur" };
  }

  const resultaat = await factuurPdf(factuur);
  if ("fout" in resultaat) return { verstuurd: false, reden: resultaat.fout };

  const totaal = euro(factuur.totalen.totaalInclBtwCenten);
  const verval = formatteerNl(vervaldatum(factuur.factuurdatum));
  const link = betaalUrl(factuur.betaaltoken);
  const aanhef = factuur.klantNaam || "klant";

  const html = await render(
    Factuurbericht({
      klantNaam: aanhef,
      factuurnummer: factuur.factuurnummer,
      totaal,
      vervaldatum: verval,
      betaalUrl: link,
      bedrijf: {
        volledig: bedrijf.volledig,
        kvk: bedrijf.kvk,
        telefoon: bedrijf.telefoon,
        email: bedrijf.email,
      },
      siteUrl,
    }),
  );

  const tekst = [
    `Beste ${aanhef},`,
    "",
    `Bedankt voor je aankoop van de Blusbox. In de bijlage vind je factuur ${factuur.factuurnummer}.`,
    `Het bedrag van ${totaal} kun je vóór ${verval} betalen via deze link:`,
    "",
    link,
    "",
    `Vragen over de factuur? Bel ons op ${bedrijf.telefoon} of mail naar ${bedrijf.email}, met het factuurnummer erbij.`,
    "",
    "—",
    bedrijf.volledig,
    `${bedrijf.telefoon} · ${bedrijf.email}`,
  ].join("\n");

  return verstuurMail({
    naar: factuur.email,
    onderwerp: `Factuur ${factuur.factuurnummer} van Blusbox — ${totaal}`,
    html,
    tekst,
    bijlagen: [
      {
        filename: `factuur-${factuur.factuurnummer}.pdf`,
        content: Buffer.from(resultaat.pdf).toString("base64"),
      },
    ],
  });
}

/**
 * Kopie van een verstuurde factuur voor de eigen administratie, met de pdf.
 *
 * Eigen mail en niet stuurBerichtkopie: die zegt "dit kreeg de klant te
 * lezen" boven de tekst, en bij een factuur is dat niet waar. Hier gaat de
 * pdf zelf mee — dat is wat de boekhouding wil hebben.
 */
export async function stuurFactuurKopie(
  factuurnummer: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }
  const naar = bestelmeldingAdres();
  if (!naar) return { verstuurd: false, reden: "MAIL_BESTELLINGEN ontbreekt" };

  const factuur = await haalFactuur({ factuurnummer });
  if (!factuur) {
    return { verstuurd: false, reden: `Factuur ${factuurnummer} niet gevonden` };
  }
  const resultaat = await factuurPdf(factuur);
  if ("fout" in resultaat) return { verstuurd: false, reden: resultaat.fout };

  const klant = [factuur.bedrijfsnaam, factuur.klantNaam].filter(Boolean).join(" · ");
  const totaal = euro(factuur.totalen.totaalInclBtwCenten);
  const regel = `Factuur ${factuur.factuurnummer} (${klant}, ${totaal}) is verstuurd aan ${factuur.email}. De pdf zit in de bijlage.`;

  return verstuurMail({
    naar,
    onderwerp: `Kopie · factuur ${factuur.factuurnummer} · ${klant} · ${totaal}`,
    html: `<p>${escapeHtml(regel)}</p>`,
    tekst: regel,
    antwoordNaar: factuur.email ?? undefined,
    bijlagen: [
      {
        filename: `factuur-${factuur.factuurnummer}.pdf`,
        content: Buffer.from(resultaat.pdf).toString("base64"),
      },
    ],
  });
}

function escapeHtml(tekst: string): string {
  return tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Seintje aan de winkelier: een factuur is via de link betaald.
 *
 * Met `dubbel` is het een waarschuwing: de factuur was al voldaan en de
 * klant heeft nóg een keer betaald. Die tweede betaling moet in Stripe
 * worden terugbetaald; de mail zegt welke.
 */
export async function stuurFactuurBetaaldMelding(
  ordernummer: string,
  dubbel?: {
    sessieId: string;
    betalingId: string | null;
    bedragCenten: number | null;
  },
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }
  const naar = bestelmeldingAdres();
  if (!naar) return { verstuurd: false, reden: "MAIL_BESTELLINGEN ontbreekt" };

  const gegevens = await haalBestelling(ordernummer);
  if (!gegevens?.order.factuurnummer) {
    return { verstuurd: false, reden: `Factuur bij ${ordernummer} niet gevonden` };
  }
  const { order } = gegevens;
  const klant = order.klantNaam ?? "onbekend";
  const regel = dubbel
    ? `Let op: factuur ${order.factuurnummer} (${klant}) was al betaald en is nog een keer betaald${
        dubbel.bedragCenten !== null ? ` (${euro(dubbel.bedragCenten)})` : ""
      }. Betaal de tweede betaling terug in Stripe: ${dubbel.betalingId ?? dubbel.sessieId}.`
    : `Factuur ${order.factuurnummer} (${klant}) is betaald: ${euro(order.totaalInclBtwCenten)}.`;

  return verstuurMail({
    naar,
    onderwerp: dubbel
      ? `Dubbel betaald · factuur ${order.factuurnummer} · terugbetalen`
      : `Betaald · factuur ${order.factuurnummer} · ${euro(order.totaalInclBtwCenten)}`,
    html: `<p>${escapeHtml(regel)}</p>`,
    tekst: regel,
    antwoordNaar: order.gastEmail ?? undefined,
  });
}
