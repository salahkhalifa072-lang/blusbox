import { render } from "@react-email/components";
import { Bestelbevestiging } from "@/emails/bestelbevestiging";
import { Terugroepbericht } from "@/emails/terugroepbericht";
import { Vervangingsherinnering } from "@/emails/vervangingsherinnering";
import { Verzendbericht } from "@/emails/verzendbericht";
import { Bezorgbericht } from "@/emails/bezorgbericht";
import { Inloglink } from "@/emails/inloglink";
import { maakHerroepingsformulier } from "./herroepingsformulier";
import { euro, verzendwaarde } from "./pricing";
import { formatteerNl, herroepingUiterlijk } from "./levensduur";
import { siteUrl } from "./site";
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
    return { verstuurd: false, reden: "RESEND_API_KEY ontbreekt" };
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
    return { verstuurd: false, reden: "RESEND_API_KEY ontbreekt" };
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
    return { verstuurd: false, reden: "RESEND_API_KEY ontbreekt" };
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
    return { verstuurd: false, reden: "RESEND_API_KEY ontbreekt" };
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
    return { verstuurd: false, reden: "RESEND_API_KEY ontbreekt" };
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

/**
 * §3 inloglink voor de magic-link-provider.
 *
 * Staat hier en niet in `auth.ts`, zodat alle uitgaande post via dezelfde
 * verzendweg loopt: één afzenderdomein, één plek waar een fout zichtbaar
 * wordt.
 */
export async function stuurInloglink(
  naar: string,
  url: string,
): Promise<MailResultaat> {
  if (!mailBeschikbaar()) {
    return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };
  }

  const html = await render(Inloglink({ url, siteUrl }));

  return verstuurMail({
    naar,
    onderwerp: "Je inloglink voor Blusbox",
    html,
    // Platte tekst erbij: een inlogmail zonder tekstversie wordt vaker als
    // verdacht aangemerkt, en dit is precies de mail die moet aankomen.
    tekst: `Inloggen bij Blusbox\n\nOpen deze link om in te loggen. Hij werkt 24 uur.\n\n${url}\n\nZelf geen link aangevraagd? Dan hoef je niets te doen.`,
  });
}
