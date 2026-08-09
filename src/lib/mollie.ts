/**
 * Minimal Mollie client (§3 — iDEAL is non-negotiable in NL).
 *
 * Written against the REST API rather than the SDK: we need three calls,
 * and a thin wrapper keeps the payment provider swappable and the
 * dependency surface small.
 *
 * The API key is read per call rather than captured at module load, so an
 * unconfigured environment fails at the moment of payment with a readable
 * message instead of at import time.
 */

const API = "https://api.mollie.com/v2";

export class MollieNietGeconfigureerd extends Error {
  constructor() {
    super(
      "MOLLIE_API_KEY ontbreekt. Betalen is pas mogelijk zodra de sleutel is ingesteld.",
    );
    this.name = "MollieNietGeconfigureerd";
  }
}

export class MollieFout extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "MollieFout";
  }
}

export function mollieBeschikbaar(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY);
}

/** True while running against a test key — surfaced in the UI. */
export function mollieTestmodus(): boolean {
  return (process.env.MOLLIE_API_KEY ?? "").startsWith("test_");
}

function sleutel(): string {
  const k = process.env.MOLLIE_API_KEY;
  if (!k) throw new MollieNietGeconfigureerd();
  return k;
}

async function verzoek<T>(
  pad: string,
  init?: RequestInit & { body?: string },
): Promise<T> {
  const res = await fetch(`${API}${pad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${sleutel()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // keep the status text
    }
    throw new MollieFout(detail, res.status);
  }

  return (await res.json()) as T;
}

export type MollieBetaling = {
  id: string;
  status:
    | "open"
    | "canceled"
    | "pending"
    | "authorized"
    | "expired"
    | "failed"
    | "paid";
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
  _links: { checkout?: { href: string } };
};

/** Cents to Mollie's decimal string: 2695 -> "26.95". */
export function centenNaarBedrag(centen: number): string {
  return (centen / 100).toFixed(2);
}

export async function maakBetaling(opts: {
  bedragCenten: number;
  omschrijving: string;
  redirectUrl: string;
  webhookUrl?: string;
  ordernummer: string;
  orderId: string;
}): Promise<MollieBetaling> {
  return verzoek<MollieBetaling>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: centenNaarBedrag(opts.bedragCenten),
      },
      description: opts.omschrijving,
      redirectUrl: opts.redirectUrl,
      // Mollie cannot reach localhost, so the webhook is omitted in dev;
      // the confirmation page falls back to polling the payment status.
      ...(opts.webhookUrl ? { webhookUrl: opts.webhookUrl } : {}),
      locale: "nl_NL",
      metadata: {
        ordernummer: opts.ordernummer,
        orderId: opts.orderId,
      },
    }),
  });
}

export async function haalBetaling(id: string): Promise<MollieBetaling> {
  return verzoek<MollieBetaling>(`/payments/${encodeURIComponent(id)}`);
}

/** Maps a Mollie status onto our own order status. */
export function naarOrderStatus(
  status: MollieBetaling["status"],
): "nieuw" | "betaald" | "geannuleerd" {
  switch (status) {
    case "paid":
      return "betaald";
    case "canceled":
    case "expired":
    case "failed":
      return "geannuleerd";
    default:
      return "nieuw";
  }
}
