import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, returns } from "@/db/schema";
import { binnenHerroepingstermijn, herroepingUiterlijk } from "./levensduur";

/**
 * Return requests (§8).
 *
 * Guest checkout is the default, so a return must be possible without an
 * account: order number plus the e-mail the order was placed with is
 * enough to identify it, and enough of a check that a stranger cannot
 * request a return on someone else's order.
 */

export class RetourGeweigerd extends Error {
  constructor(
    message: string,
    readonly oplossing?: string,
  ) {
    super(message);
    this.name = "RetourGeweigerd";
  }
}

/** Statuses where a return makes sense at all. */
const RETOURNEERBAAR = ["betaald", "verzonden", "geleverd"] as const;

function vandaagIso(): string {
  // Europe/Amsterdam — a return filed late on the last evening must not
  // fall outside the window because the server thinks in UTC.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
}

/**
 * The date the withdrawal period runs from. Delivery starts the clock, so
 * we use geleverdOp when we have it and fall back to the order date —
 * which can only ever favour the consumer, never shorten their window.
 */
function startdatum(order: typeof orders.$inferSelect): string {
  const bron = order.geleverdOp ?? order.geplaatstOp;
  return bron.toISOString().slice(0, 10);
}

export async function vraagRetourAan(invoer: {
  ordernummer: string;
  email: string;
  reden?: string;
}): Promise<{
  ordernummer: string;
  binnenTermijn: boolean;
  uiterlijk: string;
}> {
  const ordernummer = invoer.ordernummer.trim().toUpperCase();
  const email = invoer.email.trim().toLowerCase();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.ordernummer, ordernummer))
    .limit(1);

  // Same message whether the order does not exist or the e-mail does not
  // match, so this cannot be used to discover which order numbers are real.
  const onbekend = new RetourGeweigerd(
    "We kunnen deze bestelling niet vinden bij dit e-mailadres.",
    "Controleer het bestelnummer en het e-mailadres uit je bevestigingsmail.",
  );
  if (!order) throw onbekend;

  const orderEmail = (order.gastEmail ?? "").toLowerCase();
  if (orderEmail !== email) {
    // Account orders have no gastEmail; those go through the account.
    throw onbekend;
  }

  if (!(RETOURNEERBAAR as readonly string[]).includes(order.status)) {
    throw new RetourGeweigerd(
      "Deze bestelling kan op dit moment niet worden geretourneerd.",
      "Is de bestelling nog niet betaald of al terugbetaald? Neem dan contact op.",
    );
  }

  const [bestaand] = await db
    .select({ id: returns.id })
    .from(returns)
    .where(
      and(
        eq(returns.orderId, order.id),
        or(
          eq(returns.status, "aangemeld"),
          eq(returns.status, "goedgekeurd"),
          eq(returns.status, "ontvangen"),
        ),
      ),
    )
    .limit(1);

  if (bestaand) {
    throw new RetourGeweigerd(
      "Voor deze bestelling loopt al een retouraanvraag.",
      "Je hebt de instructies per e-mail ontvangen. Niets gekregen? Neem contact op.",
    );
  }

  const start = startdatum(order);
  const vandaag = vandaagIso();
  const binnenTermijn = binnenHerroepingstermijn(start, vandaag);

  // Frozen at request time (§10): whether it was inside the window is a
  // fact about this moment, and must not shift as the calendar moves on.
  await db.insert(returns).values({
    orderId: order.id,
    reden: invoer.reden?.slice(0, 2000) || null,
    binnenHerroepingstermijn: binnenTermijn,
    status: "aangemeld",
  });

  return {
    ordernummer: order.ordernummer,
    binnenTermijn,
    uiterlijk: herroepingUiterlijk(start),
  };
}

/** Returns for the dashboard, newest first. */
export async function openRetouren() {
  return db
    .select({
      id: returns.id,
      ordernummer: orders.ordernummer,
      reden: returns.reden,
      binnenTermijn: returns.binnenHerroepingstermijn,
      status: returns.status,
      aangevraagdOp: returns.aangevraagdOp,
    })
    .from(returns)
    .innerJoin(orders, eq(orders.id, returns.orderId))
    .orderBy(desc(returns.aangevraagdOp));
}
