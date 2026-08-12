import { and, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { db } from "./index";
import {
  activations,
  lots,
  orderLines,
  orders,
  products,
  recallNotices,
  recalls,
  registeredUnits,
  returns,
} from "./schema";
import { plusMaanden, type IsoDatum } from "@/lib/levensduur";

/**
 * Dashboard queries (§9). Read-only aggregates live here so the pages stay
 * presentational and the same numbers can be reused by tests.
 *
 * Authorisation is the caller's job — every dashboard page goes through
 * vereisDashboard() in lib/sessie, and the mutating actions re-check.
 */

/** §9.1 overview tiles. */
export async function overzichtCijfers(vandaag: IsoDatum) {
  const betaaldeStatussen = ["betaald", "in_behandeling", "verzonden", "geleverd"];

  const [omzet] = await db
    .select({
      centen: sum(orders.totaalInclBtwCenten).mapWith(Number),
      aantal: count(),
    })
    .from(orders)
    .where(sql`${orders.status} in ${betaaldeStatussen}`);

  const [openRetouren] = await db
    .select({ aantal: count() })
    .from(returns)
    .where(sql`${returns.status} in ('aangemeld','goedgekeurd','ontvangen')`);

  const grens = plusMaanden(vandaag, 12);
  const [verlooptBinnenJaar] = await db
    .select({ aantal: count() })
    .from(registeredUnits)
    .where(
      and(
        sql`${registeredUnits.vervaldatum} <= ${grens}`,
        sql`${registeredUnits.vervaldatum} >= ${vandaag}`,
      ),
    );

  const [geregistreerd] = await db
    .select({ aantal: count() })
    .from(registeredUnits);

  const [openRecalls] = await db
    .select({ aantal: count() })
    .from(recalls)
    .where(isNull(recalls.geslotenOp));

  const [activeringen] = await db.select({ aantal: count() }).from(activations);

  const aantalOrders = Number(omzet?.aantal ?? 0);
  const omzetCenten = Number(omzet?.centen ?? 0);

  return {
    omzetCenten,
    aantalOrders,
    // Average order value only means something once there are orders.
    aovCenten: aantalOrders > 0 ? Math.round(omzetCenten / aantalOrders) : 0,
    openRetouren: Number(openRetouren?.aantal ?? 0),
    verlooptBinnenJaar: Number(verlooptBinnenJaar?.aantal ?? 0),
    geregistreerdeUnits: Number(geregistreerd?.aantal ?? 0),
    openRecalls: Number(openRecalls?.aantal ?? 0),
    activeringen: Number(activeringen?.aantal ?? 0),
  };
}

/** §9.5 orders with fulfilment state. */
export async function bestellingenLijst(limiet = 50) {
  return db
    .select({
      id: orders.id,
      ordernummer: orders.ordernummer,
      status: orders.status,
      email: sql<string>`coalesce(${orders.gastEmail}, '')`,
      totaalCenten: orders.totaalInclBtwCenten,
      landcode: orders.landcode,
      postcode: orders.postcode,
      geplaatstOp: orders.geplaatstOp,
      verzondenOp: orders.verzondenOp,
      geleverdOp: orders.geleverdOp,
      trackAndTrace: orders.trackAndTrace,
    })
    .from(orders)
    .orderBy(desc(orders.geplaatstOp))
    .limit(limiet);
}

/** §9.2 lot register, with how many units of each lot are out there. */
export async function lotsLijst() {
  return db
    .select({
      id: lots.id,
      lotNummer: lots.lotNummer,
      productSlug: products.slug,
      productiedatum: lots.productiedatum,
      aantal: lots.aantal,
      leverancier: lots.leverancier,
      testrapportRef: lots.testrapportRef,
      docRef: lots.docRef,
      geregistreerd: sql<number>`(
        select count(*)::int from ${registeredUnits}
        where ${registeredUnits.lotId} = ${lots.id}
      )`,
      geleverd: sql<number>`(
        select coalesce(sum(${orderLines.aantal}), 0)::int from ${orderLines}
        where ${orderLines.lotId} = ${lots.id}
      )`,
      openRecall: sql<boolean>`exists(
        select 1 from ${recalls}
        where ${recalls.lotId} = ${lots.id} and ${recalls.geslotenOp} is null
      )`,
    })
    .from(lots)
    .innerJoin(products, eq(products.id, lots.productId))
    .orderBy(desc(lots.productiedatum));
}

/** §9.3 end-of-life register. */
export async function unitsLijst(limiet = 100) {
  return db
    .select({
      id: registeredUnits.id,
      lotNummer: lots.lotNummer,
      installatiedatum: registeredUnits.installatiedatum,
      vervaldatum: registeredUnits.vervaldatum,
      locatieType: registeredUnits.locatieType,
      postcode: registeredUnits.postcode,
      herinnering12Op: registeredUnits.herinnering12Op,
      herinnering6Op: registeredUnits.herinnering6Op,
      herinnering1Op: registeredUnits.herinnering1Op,
    })
    .from(registeredUnits)
    .innerJoin(lots, eq(lots.id, registeredUnits.lotId))
    .orderBy(registeredUnits.vervaldatum)
    .limit(limiet);
}

/** §9.4 activation log — the field data nobody else in this niche holds. */
export async function activeringenLijst(limiet = 100) {
  return db
    .select({
      id: activations.id,
      gebeurdOp: activations.gebeurdOp,
      oorzaak: activations.oorzaak,
      afloop: activations.afloop,
      lotNummer: lots.lotNummer,
      locatieType: registeredUnits.locatieType,
      postcode: registeredUnits.postcode,
    })
    .from(activations)
    .innerJoin(
      registeredUnits,
      eq(registeredUnits.id, activations.registeredUnitId),
    )
    .innerJoin(lots, eq(lots.id, registeredUnits.lotId))
    .orderBy(desc(activations.gebeurdOp))
    .limit(limiet);
}

/** Open and closed recalls, with acknowledgement progress. */
export async function recallsLijst() {
  return db
    .select({
      id: recalls.id,
      lotNummer: lots.lotNummer,
      reden: recalls.reden,
      geopendOp: recalls.geopendOp,
      geslotenOp: recalls.geslotenOp,
      aangeschreven: sql<number>`(
        select count(*)::int from ${recallNotices}
        where ${recallNotices.recallId} = ${recalls.id}
      )`,
      bevestigd: sql<number>`(
        select count(*)::int from ${recallNotices}
        where ${recallNotices.recallId} = ${recalls.id}
          and ${recallNotices.bevestigdOp} is not null
      )`,
      verzonden: sql<number>`(
        select count(*)::int from ${recallNotices}
        where ${recallNotices.recallId} = ${recalls.id}
          and ${recallNotices.verzondenOp} is not null
      )`,
    })
    .from(recalls)
    .innerJoin(lots, eq(lots.id, recalls.lotId))
    .orderBy(desc(recalls.geopendOp));
}

/** Returns queue (§9.5). */
export async function retourenLijst() {
  return db
    .select({
      id: returns.id,
      ordernummer: orders.ordernummer,
      status: returns.status,
      binnenTermijn: returns.binnenHerroepingstermijn,
      reden: returns.reden,
      aangevraagdOp: returns.aangevraagdOp,
    })
    .from(returns)
    .innerJoin(orders, eq(orders.id, returns.orderId))
    .orderBy(desc(returns.aangevraagdOp));
}

/** Units whose reminders are still open, for the scheduler view. */
export async function herinneringenOpenstaand(vandaag: IsoDatum) {
  return db
    .select({ aantal: count() })
    .from(registeredUnits)
    .where(
      and(
        gte(registeredUnits.vervaldatum, vandaag),
        isNull(registeredUnits.herinnering12Op),
      ),
    );
}

/** De afnemers achter één recall, voor het detailoverzicht (§9.2). */
export async function recallOntvangersLijst(recallId: string) {
  return db
    .select({
      id: recallNotices.id,
      email: recallNotices.email,
      verzondenOp: recallNotices.verzondenOp,
      bevestigdOp: recallNotices.bevestigdOp,
    })
    .from(recallNotices)
    .where(eq(recallNotices.recallId, recallId))
    .orderBy(recallNotices.email);
}
