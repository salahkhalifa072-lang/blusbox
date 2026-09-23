import { render } from "@react-email/components";
import { Bestelbevestiging } from "@/emails/bestelbevestiging";
import { Bestelmelding } from "@/emails/bestelmelding";
import { Klantbericht } from "@/emails/klantbericht";
import { Berichtkopie } from "@/emails/berichtkopie";
import { Terugroepbericht } from "@/emails/terugroepbericht";
import { Vervangingsherinnering } from "@/emails/vervangingsherinnering";
import { Verzendbericht } from "@/emails/verzendbericht";
import { Bezorgbericht } from "@/emails/bezorgbericht";
import { maakHerroepingsformulier } from "./herroepingsformulier";
import { euro, verzendwaarde } from "./pricing";
import { formatteerNl, herroepingUiterlijk } from "./levensduur";
import { siteUrl } from "./site";
import { bedrijf } from "./bedrijf";
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

  const adres = [
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
