import { and, eq, isNotNull, lte, or, sql } from "drizzle-orm";
import { db } from "./index";
import {
  lots,
  orderLines,
  orders,
  registeredUnits,
  users,
  type Rol,
} from "./schema";
import { magDashboard, unitScope, vereis } from "@/lib/rollen";

export type Actor = { id: string; rol: Rol };

/**
 * §9.2 / §15: from a lot number to the list of customers who hold units
 * from it. This is the query the dashboard exists for, so it lives here
 * rather than being assembled ad hoc in a route.
 *
 * Two paths are unioned because a unit can be known in two ways:
 *  - registered: the customer told us where it is installed
 *  - shipped only: we know which order line carried the lot
 * A recall must reach both, including guests who never made an account.
 */
export async function afnemersVanLot(actor: Actor, lotNummer: string) {
  vereis(magDashboard(actor.rol), "afnemerslijst van een lot opvragen");

  const [lot] = await db
    .select({ id: lots.id })
    .from(lots)
    .where(eq(lots.lotNummer, lotNummer))
    .limit(1);

  if (!lot) return [];

  const viaRegistratie = db
    .select({
      email: sql<string>`coalesce(${users.email}, ${orders.gastEmail})`.as(
        "email",
      ),
      naam: users.name,
      userId: registeredUnits.userId,
      ordernummer: orders.ordernummer,
      unitId: sql<string | null>`${registeredUnits.id}`.as("unit_id"),
      installatiedatum: sql<string | null>`${registeredUnits.installatiedatum}`.as(
        "installatiedatum",
      ),
      postcode: registeredUnits.postcode,
    })
    .from(registeredUnits)
    .leftJoin(users, eq(users.id, registeredUnits.userId))
    .leftJoin(orderLines, eq(orderLines.id, registeredUnits.orderLineId))
    .leftJoin(orders, eq(orders.id, orderLines.orderId))
    .where(eq(registeredUnits.lotId, lot.id));

  const viaBestelling = db
    .select({
      email: sql<string>`coalesce(${users.email}, ${orders.gastEmail})`.as(
        "email",
      ),
      naam: users.name,
      userId: orders.userId,
      ordernummer: orders.ordernummer,
      unitId: sql<string | null>`null`.as("unit_id"),
      installatiedatum: sql<string | null>`null`.as("installatiedatum"),
      postcode: orders.postcode,
    })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orderLines.lotId, lot.id));

  return viaRegistratie.union(viaBestelling);
}

/**
 * §9.3 reminder scheduler: units whose next reminder is due. Cheap
 * because `vervaldatum` is stored and indexed rather than computed.
 */
export async function unitsMetVerlopenHerinnering(
  actor: Actor,
  grens: { twaalf: string; zes: string; een: string },
) {
  vereis(magDashboard(actor.rol), "herinneringen inplannen");

  return db
    .select()
    .from(registeredUnits)
    .where(
      or(
        and(
          lte(registeredUnits.vervaldatum, grens.twaalf),
          sql`${registeredUnits.herinnering12Op} is null`,
        ),
        and(
          lte(registeredUnits.vervaldatum, grens.zes),
          sql`${registeredUnits.herinnering6Op} is null`,
        ),
        and(
          lte(registeredUnits.vervaldatum, grens.een),
          sql`${registeredUnits.herinnering1Op} is null`,
        ),
      ),
    );
}

/**
 * Units visible to the actor. The scope comes from lib/rollen, so a klant
 * physically cannot select another customer's rows — the filter is in the
 * WHERE clause, not in a template.
 */
export async function zichtbareUnits(actor: Actor) {
  const scope = unitScope(actor);

  const basis = db.select().from(registeredUnits);

  switch (scope.soort) {
    case "alles":
      return basis;
    case "installateur":
      return basis.where(
        eq(registeredUnits.installateurId, scope.installateurId),
      );
    case "eigenaar":
      return basis.where(eq(registeredUnits.userId, scope.userId));
  }
}

/** §9.1 overview tile: units expiring within twelve months. */
export async function aantalVerlooptBinnen(actor: Actor, grensdatum: string) {
  vereis(magDashboard(actor.rol), "voorraad- en vervalcijfers opvragen");

  const [row] = await db
    .select({ aantal: sql<number>`count(*)::int` })
    .from(registeredUnits)
    .where(
      and(
        lte(registeredUnits.vervaldatum, grensdatum),
        isNotNull(registeredUnits.installatiedatum),
      ),
    );

  return row?.aantal ?? 0;
}
