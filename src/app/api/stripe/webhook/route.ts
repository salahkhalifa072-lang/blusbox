import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { leesWebhookGebeurtenis, naarOrderStatus } from "@/lib/stripe";
import { markeerBetaald } from "@/lib/bestelling";
import { stuurBestelbevestiging, stuurBestelmelding } from "@/lib/mail";

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
        const ordernummer = sessie.metadata?.ordernummer;
        if (!orderId) break;

        const status = naarOrderStatus(sessie.payment_status);
        await markeerBetaald(
          orderId,
          sessie.id,
          status,
          sessie.customer_details?.name ?? undefined,
        );

        // Mail pas als het geld binnen is. Een mislukte verzending wordt
        // gelogd en nooit opnieuw gegooid: de betaling is al geslaagd, en
        // een 500 hier laat Stripe de hele gebeurtenis opnieuw afspelen.
        //
        // De twee mails staan bewust naast elkaar in plaats van achter
        // elkaar. Ze hebben verschillende ontvangers en verschillende
        // faalredenen — een klant met een adres dat bounct, of een fout in
        // het pdf'je, mag er niet toe leiden dat de winkelier zijn eigen
        // bestelling niet te zien krijgt. allSettled, want een afwijzing
        // van de een mag de ander niet afbreken.
        if (status === "betaald" && ordernummer) {
          const klantEmail = sessie.customer_details?.email ?? undefined;

          const [bevestiging, melding] = await Promise.allSettled([
            stuurBestelbevestiging(ordernummer, klantEmail),
            stuurBestelmelding(ordernummer, klantEmail),
          ]);

          if (bevestiging.status === "rejected") {
            console.error(
              `Bevestigingsmail voor ${ordernummer} gooide:`,
              bevestiging.reason,
            );
          } else if (!bevestiging.value.verstuurd) {
            console.error(
              `Bevestigingsmail voor ${ordernummer} niet verstuurd: ${bevestiging.value.reden}`,
            );
          }

          if (melding.status === "rejected") {
            console.error(
              `Bestelmelding voor ${ordernummer} gooide:`,
              melding.reason,
            );
          } else if (!melding.value.verstuurd) {
            console.error(
              `Bestelmelding voor ${ordernummer} niet verstuurd: ${melding.value.reden}`,
            );
          }
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
