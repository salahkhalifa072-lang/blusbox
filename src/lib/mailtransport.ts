/**
 * §3 verzendlaag voor transactionele mail — MailerSend.
 *
 * Rechtstreeks tegen de REST-API in plaats van via hun SDK. Het is één
 * POST met een JSON-body; een pakket erbij zou hier alleen een extra
 * afhankelijkheid zijn die meeversiebeheerd moet worden.
 *
 * Alles hier geeft een resultaat terug in plaats van te gooien. De
 * aanroepers zitten achter een betaling of een terugroepactie: als het
 * mailen misgaat is dat iets om te loggen en opnieuw te proberen, nooit een
 * reden om de bestelling te laten mislukken.
 */

const API = "https://api.mailersend.com/v1/email";

export class MailNietGeconfigureerd extends Error {
  constructor() {
    super(
      "MAILERSEND_API_TOKEN ontbreekt; er wordt geen e-mail verstuurd.",
    );
    this.name = "MailNietGeconfigureerd";
  }
}

export type MailResultaat =
  | { verstuurd: true; id: string }
  | { verstuurd: false; reden: string };

export function mailBeschikbaar(): boolean {
  return Boolean(process.env.MAILERSEND_API_TOKEN);
}

/**
 * "Blusbox <info@blusbox.nl>" uit elkaar halen.
 *
 * MailerSend wil naam en adres apart; de omgevingsvariabele houdt de
 * vertrouwde één-regelvorm aan, zodat het instellen niet verandert.
 */
export function splitsAfzender(regel: string): { email: string; name?: string } {
  const m = regel.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { email: m[2].trim(), name: m[1].trim() || undefined };
  return { email: regel.trim() };
}

export function afzender(): { email: string; name?: string } {
  return splitsAfzender(process.env.MAIL_VAN ?? "Blusbox <info@blusbox.nl>");
}

export type Bijlage = {
  filename: string;
  /** base64, zonder data:-prefix */
  content: string;
};

export async function verstuurMail(opdracht: {
  naar: string;
  onderwerp: string;
  html: string;
  /** Platte tekst; zonder dit scoort een bericht slechter bij spamfilters */
  tekst?: string;
  bijlagen?: Bijlage[];
  /** Eigen kop-velden, bijvoorbeeld om een terugroepbericht te markeren */
  headers?: Record<string, string>;
}): Promise<MailResultaat> {
  const token = process.env.MAILERSEND_API_TOKEN;
  if (!token) return { verstuurd: false, reden: "MAILERSEND_API_TOKEN ontbreekt" };

  const body: Record<string, unknown> = {
    from: afzender(),
    to: [{ email: opdracht.naar }],
    subject: opdracht.onderwerp,
    html: opdracht.html,
  };
  if (opdracht.tekst) body.text = opdracht.tekst;
  if (opdracht.bijlagen?.length) {
    body.attachments = opdracht.bijlagen.map((b) => ({
      filename: b.filename,
      content: b.content,
      disposition: "attachment",
    }));
  }
  if (opdracht.headers) {
    body.headers = Object.entries(opdracht.headers).map(([name, value]) => ({
      name,
      value,
    }));
  }

  try {
    const antwoord = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    // MailerSend antwoordt met 202 en een leeg lichaam; het bericht-id zit
    // in een kop. 200 komt voor wanneer er wél een lichaam is.
    if (antwoord.status === 202 || antwoord.ok) {
      const id =
        antwoord.headers.get("x-message-id") ??
        antwoord.headers.get("X-Message-Id") ??
        "";
      return { verstuurd: true, id };
    }

    // Foutlichaam meenemen: "422" alleen zegt niemand iets. MailerSend
    // schrijft hier bijvoorbeeld dat het afzenderdomein niet geverifieerd is.
    let detail = "";
    try {
      detail = (await antwoord.text()).slice(0, 400);
    } catch {
      /* lichaam niet leesbaar; de status alleen moet het dan doen */
    }
    return {
      verstuurd: false,
      reden: `MailerSend gaf ${antwoord.status}${detail ? `: ${detail}` : ""}`,
    };
  } catch (fout) {
    return { verstuurd: false, reden: (fout as Error).message };
  }
}
