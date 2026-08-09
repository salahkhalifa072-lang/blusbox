import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { leesWebhookGebeurtenis, naarOrderStatus } from "@/lib/stripe";
import { markeerBetaald } from "@/lib/bestelling";

/**
 * Stripe webhook.
 *
 * The signature check is the whole security boundary: without it anyone
 * could POST "payment succeeded" and mark an order paid. So the raw body
 * is read as text and passed through untouched — parsing and
 * re-stringifying changes bytes and invalidates the signature.
 *
 * Answer 200 for anything we have handled or deliberately ignore; only
 * return 5xx for a genuine failure on our side, since that is what makes
 * Stripe retry.
 */
export async function POST(request: Request) {
  const handtekening = request.headers.get("stripe-signature");
  if (!handtekening) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ruweBody = await request.text();

  let gebeurtenis;
  try {
    gebeurtenis = leesWebhookGebeurtenis(ruweBody, handtekening);
  } catch (fout) {
    // Bad signature or missing secret: never retryable, never trusted.
    console.error("Stripe-webhook geweigerd:", (fout as Error).message);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    switch (gebeurtenis.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        // iDEAL settles asynchronously: the session can complete before the
        // bank confirms, so only payment_status decides.
        const sessie = gebeurtenis.data.object as Stripe.Checkout.Session;
        const orderId = sessie.metadata?.orderId;
        if (orderId) {
          await markeerBetaald(
            orderId,
            sessie.id,
            naarOrderStatus(sessie.payment_status),
          );
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const sessie = gebeurtenis.data.object as Stripe.Checkout.Session;
        const orderId = sessie.metadata?.orderId;
        if (orderId) {
          await markeerBetaald(orderId, sessie.id, "geannuleerd");
        }
        break;
      }

      default:
        // Everything else is Stripe being chatty; acknowledge and move on.
        break;
    }

    return NextResponse.json({ ontvangen: true });
  } catch (fout) {
    console.error("Stripe-webhook verwerken mislukt:", fout);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
