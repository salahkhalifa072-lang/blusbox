import Stripe from "stripe";

/**
 * Stripe payments (§3 — iDEAL is non-negotiable in NL, and Stripe carries
 * it alongside Bancontact and cards).
 *
 * We use hosted Checkout Sessions rather than Elements: Stripe then owns
 * the payment page, the iDEAL bank picker and PSD2/SCA handling, which
 * keeps card data entirely off our infrastructure.
 *
 * The client is built per call rather than at module load, so an
 * unconfigured environment fails at the moment of payment with a readable
 * message instead of breaking the build.
 */

export class StripeNietGeconfigureerd extends Error {
  constructor() {
    super(
      "STRIPE_SECRET_KEY ontbreekt. Betalen is pas mogelijk zodra de sleutel is ingesteld.",
    );
    this.name = "StripeNietGeconfigureerd";
  }
}

export function stripeBeschikbaar(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True while running against a test key — surfaced in the UI. */
export function stripeTestmodus(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}

export function stripeClient(): Stripe {
  const sleutel = process.env.STRIPE_SECRET_KEY;
  if (!sleutel) throw new StripeNietGeconfigureerd();
  return new Stripe(sleutel, {
    // Pin the version: an account-level API upgrade must never silently
    // change how an order is charged.
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
  });
}

export type CheckoutRegel = {
  naam: string;
  omschrijving?: string;
  /** Unit price incl. btw in cents — what the customer actually pays. */
  stukprijsCenten: number;
  aantal: number;
};

/**
 * Creates a hosted Checkout Session and returns its URL.
 *
 * Amounts are passed as inline price_data rather than Stripe Price
 * objects, so the catalogue in this repo stays the single source of
 * truth and no one has to keep two price lists in sync.
 */
export async function maakCheckoutSessie(opts: {
  regels: CheckoutRegel[];
  email?: string;
  ordernummer: string;
  orderId: string;
  succesUrl: string;
  annuleerUrl: string;
  /** Set for reverse-charged EU business orders, for the receipt. */
  btwVerlegd?: boolean;
}): Promise<{ id: string; url: string | null }> {
  const stripe = stripeClient();

  const sessie = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "nl",
    /*
     * Bewust géén `payment_method_types`.
     *
     * Stond hier eerst hard `["ideal", "card", "bancontact"]`. Dat breekt
     * het afrekenen volledig zodra één van de drie niet is geactiveerd:
     * Stripe weigert dan de hele sessie in plaats van die ene methode weg
     * te laten. Bij het live zetten is dat precies het moment waarop je er
     * last van krijgt. Laat je het veld weg, dan bepaalt het dashboard wat
     * er wordt aangeboden en verschijnt iDEAL zodra het daar aanstaat.
     */
    customer_email: opts.email,
    line_items: opts.regels.map((r) => ({
      quantity: r.aantal,
      price_data: {
        currency: "eur",
        unit_amount: r.stukprijsCenten,
        product_data: {
          name: r.naam,
          ...(r.omschrijving ? { description: r.omschrijving } : {}),
        },
      },
    })),
    // Shipping is free on every order (§8), so it is stated rather than
    // charged — a zero-cost shipping option makes that explicit on the
    // Stripe page too.
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "eur" },
          display_name: "Gratis verzending",
        },
      },
    ],
    success_url: opts.succesUrl,
    cancel_url: opts.annuleerUrl,
    metadata: {
      ordernummer: opts.ordernummer,
      orderId: opts.orderId,
      btwVerlegd: opts.btwVerlegd ? "ja" : "nee",
    },
  });

  return { id: sessie.id, url: sessie.url };
}

/**
 * Verifies a webhook signature and returns the event.
 *
 * Signature verification is the entire security boundary here: without it
 * anyone could POST a "payment succeeded" event and mark an order paid.
 * The raw request body must be passed unparsed — JSON.parse then
 * re-stringify changes bytes and the signature no longer matches.
 */
export function leesWebhookGebeurtenis(
  ruweBody: string,
  handtekening: string,
): Stripe.Event {
  const geheim = process.env.STRIPE_WEBHOOK_SECRET;
  if (!geheim) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET ontbreekt; webhook kan niet worden geverifieerd.",
    );
  }
  return stripeClient().webhooks.constructEvent(
    ruweBody,
    handtekening,
    geheim,
  );
}

/** Maps a Checkout Session payment status onto our own order status. */
export function naarOrderStatus(
  status: Stripe.Checkout.Session.PaymentStatus | string,
): "nieuw" | "betaald" | "geannuleerd" {
  switch (status) {
    case "paid":
    case "no_payment_required":
      return "betaald";
    case "unpaid":
      return "nieuw";
    default:
      return "nieuw";
  }
}
