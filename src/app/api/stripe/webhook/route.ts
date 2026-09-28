import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { leesWebhookGebeurtenis, naarOrderStatus } from "@/lib/stripe";
import { markeerBetaald } from "@/lib/bestelling";
import {
  stuurBestelbevestiging,
  stuurBestelmelding,
  stuurFactuurBetaaldMelding,
} from "@/lib/mail";
import { markeerFactuurBetaald } from "@/db/facturen";
import {
  draaiCommissieTerug,
  maakCommissieVoorBestelling,
} from "@/db/affiliate";
import {
  gebeurtenisAlVerwerkt,
  orderIdViaBetaling,
} from "@/lib/affiliate/webhook";

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

  /*
   * Idempotentie, vóór alles.
   *
   * Stripe levert bij twijfel opnieuw af: na een time-out, na een 500, of
   * gewoon omdat het kan. Zonder grendel zou dezelfde betaling een tweede
   * commissie opleveren en een tweede bestelbevestiging versturen. Het
   * invoegen van het event-id is die grendel; mislukt het invoegen, dan is
   * dit een herhaling en zijn we klaar.
   *
   * Bewust ná de handtekeningcontrole: anders kan iemand met verzonnen
   * event-id's de tabel volschrijven.
   */
  if (await gebeurtenisAlVerwerkt(gebeurtenis.id, gebeurtenis.type)) {
    return NextResponse.json({ ontvangen: true, herhaling: true });
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

        // Betaling van een balieverkoop via de factuurlink. Geen
        // bestelbevestiging met herroepingsformulier (er is geen koop op
        // afstand) en geen bestelmelding (er valt niets te verzenden) —
        // alleen een seintje aan de winkelier dat het geld binnen is.
        if (sessie.metadata?.bron === "factuur") {
          if (status !== "betaald") break;
          const uitkomst = await markeerFactuurBetaald(orderId, sessie.id);
          if (uitkomst !== "herhaald" && ordernummer) {
            // Bij "dubbel" is de klant twee keer afgeschreven; de melding
            // zegt dan welke betaling terugbetaald moet worden.
            const melding = await stuurFactuurBetaaldMelding(
              ordernummer,
              uitkomst === "dubbel"
                ? {
                    sessieId: sessie.id,
                    betalingId:
                      typeof sessie.payment_intent === "string"
                        ? sessie.payment_intent
                        : (sessie.payment_intent?.id ?? null),
                    bedragCenten: sessie.amount_total ?? null,
                  }
                : undefined,
            ).catch(
              (fout: unknown) => ({ verstuurd: false as const, reden: String(fout) }),
            );
            if (uitkomst === "dubbel") {
              console.error(
                `Dubbele betaling op factuur ${ordernummer}: sessie ${sessie.id} moet terugbetaald worden.`,
              );
            }
            if (!melding.verstuurd) {
              console.error(
                `Betaalmelding factuur ${ordernummer} niet verstuurd: ${melding.reden}`,
              );
            }
          }
          break;
        }
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
        if (status === "betaald") {
          // Commissie pas nu: de toeschrijving is bij het afrekenen
          // vastgelegd, maar een bestelling die nooit betaald wordt hoort
          // niets op te leveren. Fouten hier mogen de bevestigingsmail
          // niet tegenhouden — de klant heeft betaald en wacht op bericht.
          try {
            const uitkomst = await maakCommissieVoorBestelling(orderId);
            if (uitkomst.gemaakt) {
              console.log(
                `Affiliatecommissie ${ordernummer ?? orderId}: € ${(uitkomst.bedragCenten / 100).toFixed(2)}`,
              );
            }
          } catch (fout) {
            console.error(
              "Affiliatecommissie aanmaken mislukt:",
              (fout as Error).message,
            );
          }
        }

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
        // Een factuur blijft openstaan als één betaalpoging strandt of
        // verloopt: de link in de mail maakt bij de volgende klik gewoon
        // een nieuwe sessie.
        if (orderId && sessie.metadata?.bron !== "factuur") {
          await markeerBetaald(orderId, sessie.id, "geannuleerd");
          await draaiCommissieTerug({
            orderId,
            reden: "Betaling geannuleerd of verlopen",
          }).catch((fout: unknown) =>
            console.error("Commissie terugdraaien mislukt:", fout),
          );
        }
        break;
      }

      /*
       * Terugbetalingen en terugboekingen.
       *
       * Stripe koppelt deze events aan de betaling, niet aan onze
       * bestelling, dus het ordernummer komt uit de metadata van de
       * bijbehorende Checkout-sessie. Zonder die koppeling weten we niet
       * welke commissie het betreft en doen we liever niets dan het
       * verkeerde.
       */
      case "charge.refunded":
      case "charge.dispute.created": {
        const lading = gebeurtenis.data.object as
          | Stripe.Charge
          | Stripe.Dispute;
        const betalingId =
          typeof lading.payment_intent === "string"
            ? lading.payment_intent
            : (lading.payment_intent?.id ?? null);
        if (!betalingId) break;

        const orderId = await orderIdViaBetaling(betalingId);
        if (!orderId) break;

        await draaiCommissieTerug({
          orderId,
          reden:
            gebeurtenis.type === "charge.refunded"
              ? "Terugbetaling via Stripe"
              : "Terugboeking (chargeback)",
        }).catch((fout: unknown) =>
          console.error("Commissie terugdraaien mislukt:", fout),
        );
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
