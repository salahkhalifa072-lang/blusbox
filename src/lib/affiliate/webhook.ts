import { eq } from "drizzle-orm";
import { db } from "@/db";
import { verwerkteWebhooks } from "@/db/affiliate-schema";
import { orders } from "@/db/schema";

/**
 * Is deze gebeurtenis al eerder verwerkt?
 *
 * Werkt door hem te registreren, niet door eerst te kijken. Dat verschil
 * is de hele truc: "eerst kijken, dan schrijven" heeft een gat tussen die
 * twee stappen waar een tweede aflevering precies in past, en dan draaien
 * beide door. Het invoegen zelf is atomair — botst het op de unieke
 * sleutel, dan was er al een, en dat is het antwoord.
 *
 * Bij een databasefout geven we false terug: liever een keer dubbel
 * verwerkt dan een betaling die helemaal niet wordt afgehandeld. De
 * unieke sleutel op de commissie vangt dat tweede geval alsnog af.
 */
export async function gebeurtenisAlVerwerkt(
  eventId: string,
  type: string,
): Promise<boolean> {
  try {
    const rijen = await db
      .insert(verwerkteWebhooks)
      .values({ eventId, type })
      .onConflictDoNothing({ target: verwerkteWebhooks.eventId })
      .returning({ id: verwerkteWebhooks.id });

    return rijen.length === 0;
  } catch (fout) {
    console.error(
      "Webhook-idempotentie kon niet worden vastgelegd:",
      (fout as Error).message,
    );
    return false;
  }
}

/**
 * De bestelling achter een Stripe-betaling.
 *
 * Terugbetalingen en terugboekingen wijzen naar een payment intent, niet
 * naar onze bestelling. De koppeling loopt via het sessie-id dat bij de
 * betaling is opgeslagen — vandaar het zoeken op mollieId, dat ondanks de
 * naam het Stripe-sessie-id bevat sinds de overstap.
 */
export async function orderIdViaBetaling(
  betalingId: string,
): Promise<string | null> {
  const { stripeClient } = await import("@/lib/stripe");

  try {
    const stripe = stripeClient();
    const intent = await stripe.paymentIntents.retrieve(betalingId, {
      expand: ["latest_charge"],
    });

    // Het ordernummer staat in de metadata van de sessie; de intent erft
    // die niet automatisch. Daarom zoeken we de sessie erbij.
    const sessies = await stripe.checkout.sessions.list({
      payment_intent: betalingId,
      limit: 1,
    });
    const orderId = sessies.data[0]?.metadata?.orderId;
    if (orderId) return orderId;

    const viaIntent = intent.metadata?.orderId;
    if (viaIntent) return viaIntent;

    const sessieId = sessies.data[0]?.id;
    if (!sessieId) return null;

    const [rij] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.mollieId, sessieId))
      .limit(1);
    return rij?.id ?? null;
  } catch (fout) {
    console.error(
      "Bestelling bij betaling niet gevonden:",
      (fout as Error).message,
    );
    return null;
  }
}
