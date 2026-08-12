import { Resend } from "resend";
import { render } from "@react-email/components";
import { Bestelbevestiging } from "@/emails/bestelbevestiging";
import { Terugroepbericht } from "@/emails/terugroepbericht";
import { maakHerroepingsformulier } from "./herroepingsformulier";
import { euro, verzendwaarde } from "./pricing";
import { formatteerNl, herroepingUiterlijk } from "./levensduur";
import { siteUrl } from "./site";
import { haalBestelling } from "./bestelling";

/**
 * Transactional mail (§3).
 *
 * Sending must never break a payment. The webhook that calls this has
 * already taken the customer's money and marked the order paid; if the
 * mail fails, that is a problem to log and retry, not a reason to return
 * 500 and have Stripe replay the whole event.
 */

export class MailNietGeconfigureerd extends Error {
  constructor() {
    super("RESEND_API_KEY ontbreekt; er wordt geen e-mail verstuurd.");
    this.name = "MailNietGeconfigureerd";
  }
}

export function mailBeschikbaar(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function client(): Resend {
  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) throw new MailNietGeconfigureerd();
  return new Resend(sleutel);
}

function afzender(): string {
  return process.env.MAIL_VAN ?? "Blusbox <onboarding@resend.dev>";
}

export type MailResultaat =
  | { verstuurd: true; id: string }
  | { verstuurd: false; reden: string };

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
  const naar = ontvanger ?? order.gastEmail;
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

  try {
    const { data, error } = await client().emails.send({
      from: afzender(),
      to: naar,
      subject: `Bestelling ${order.ordernummer} bevestigd — Blusbox`,
      html,
      attachments: [
        {
          filename: "modelformulier-herroeping-blusbox.pdf",
          content: Buffer.from(formulier).toString("base64"),
        },
      ],
    });

    if (error) return { verstuurd: false, reden: error.message };
    if (!data?.id) return { verstuurd: false, reden: "Geen bericht-id ontvangen" };
    return { verstuurd: true, id: data.id };
  } catch (fout) {
    return { verstuurd: false, reden: (fout as Error).message };
  }
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

  try {
    const { data, error } = await client().emails.send({
      from: afzender(),
      to: opdracht.email,
      // Geen "Blusbox" vooraan: in een volle inbox moet het eerste woord al
      // duidelijk maken dat dit geen nieuwsbrief is.
      subject: `Veiligheidswaarschuwing: vervang je Blusbox (lot ${opdracht.lotNummer})`,
      html,
      headers: {
        // Een terugroepbericht is geen bulkmail. Deze vlaggen houden het uit
        // filters die "list mail" naar het tabblad Reclame duwen.
        "X-Entity-Ref-ID": opdracht.noticeId,
        Importance: "high",
        Priority: "urgent",
      },
    });

    if (error) return { verstuurd: false, reden: error.message };
    if (!data?.id) return { verstuurd: false, reden: "Geen bericht-id ontvangen" };
    return { verstuurd: true, id: data.id };
  } catch (fout) {
    return { verstuurd: false, reden: (fout as Error).message };
  }
}
