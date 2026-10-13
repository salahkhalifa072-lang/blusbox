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
import { affiliates } from "./affiliate-schema";
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

/**
 * Filters op de bestellingenpagina. Elk filter is één vraag die je je in
 * de praktijk stelt — "wat moet er de deur uit?" — en niet een ruwe
 * status: "te versturen" is betaald én nog niet verzonden én geen
 * balieverkoop, wat geen enkele status op zichzelf uitdrukt.
 */
export const BESTELFILTERS = {
  alle: { label: "Alle", where: sql`true` },
  versturen: {
    label: "Te versturen",
    where: sql`${orders.status} in ('betaald','in_behandeling') and ${orders.verzondenOp} is null and ${orders.balieverkoop} = false`,
  },
  onderweg: {
    label: "Onderweg",
    where: sql`${orders.verzondenOp} is not null and ${orders.geleverdOp} is null and ${orders.status} not in ('geannuleerd','terugbetaald')`,
  },
  afgerond: {
    label: "Afgerond",
    where: sql`(${orders.status} = 'geleverd' or (${orders.balieverkoop} = true and ${orders.status} <> 'nieuw'))`,
  },
  onbetaald: { label: "Wacht op betaling", where: sql`${orders.status} = 'nieuw'` },
  geannuleerd: {
    label: "Geannuleerd",
    where: sql`${orders.status} in ('geannuleerd','terugbetaald')`,
  },
} as const;

export type Bestelfilter = keyof typeof BESTELFILTERS;

export function isBestelfilter(w: unknown): w is Bestelfilter {
  return typeof w === "string" && w in BESTELFILTERS;
}

/** Aantallen per filter, voor de knoppen boven de lijst. */
export async function bestelfilterAantallen(): Promise<Record<Bestelfilter, number>> {
  const sleutels = Object.keys(BESTELFILTERS) as Bestelfilter[];
  const [rij] = await db
    .select(
      Object.fromEntries(
        sleutels.map((k) => [
          k,
          sql<number>`count(*) filter (where ${BESTELFILTERS[k].where})`.mapWith(Number),
        ]),
      ) as Record<Bestelfilter, ReturnType<typeof sql<number>>>,
    )
    .from(orders);
  return rij as Record<Bestelfilter, number>;
}

/** §9.5 orders with fulfilment state. */
export async function bestellingenLijst(
  limiet = 50,
  opties: { zoek?: string; filter?: Bestelfilter } = {},
) {
  const voorwaarden = [BESTELFILTERS[opties.filter ?? "alle"].where];

  // Zoeken op wat je van een klant weet als hij belt: nummer, naam,
  // e-mail of postcode. Postcode zonder spatie, zoals hij opgeslagen staat.
  const zoek = opties.zoek?.trim();
  if (zoek) {
    // % en _ zijn jokers in ilike; letterlijk zoeken, anders gaf "%" alles.
    const ontsnapt = (t: string) => t.replace(/[%_\\]/g, (c) => `\\${c}`);
    const patroon = `%${ontsnapt(zoek)}%`;
    const postcode = `%${ontsnapt(zoek.replace(/\s+/g, "").toUpperCase())}%`;
    voorwaarden.push(
      sql`(${orders.ordernummer} ilike ${patroon}
        or ${orders.klantNaam} ilike ${patroon}
        or ${orders.bedrijfsnaam} ilike ${patroon}
        or ${orders.gastEmail} ilike ${patroon}
        or ${orders.postcode} ilike ${postcode})`,
    );
  }

  return db
    .select({
      id: orders.id,
      ordernummer: orders.ordernummer,
      status: orders.status,
      email: sql<string>`coalesce(${orders.gastEmail}, '')`,
      klantNaam: orders.klantNaam,
      totaalCenten: orders.totaalInclBtwCenten,
      landcode: orders.landcode,
      postcode: orders.postcode,
      geplaatstOp: orders.geplaatstOp,
      verzondenOp: orders.verzondenOp,
      geleverdOp: orders.geleverdOp,
      trackAndTrace: orders.trackAndTrace,
      balieverkoop: orders.balieverkoop,
    })
    .from(orders)
    .where(and(...voorwaarden))
    .orderBy(desc(orders.geplaatstOp))
    .limit(limiet);
}

/**
 * Wat er nu op jou wacht. Bovenaan het overzicht, zodat je niet uit acht
 * tegels hoeft af te leiden of er iets te doen is.
 */
export async function teDoen() {
  const [bestel] = await db
    .select({
      versturen: sql<number>`count(*) filter (where ${BESTELFILTERS.versturen.where})`.mapWith(Number),
      onderwegLang: sql<number>`count(*) filter (where ${BESTELFILTERS.onderweg.where} and ${orders.verzondenOp} < now() - interval '5 days')`.mapWith(Number),
      openFacturen: sql<number>`count(*) filter (where ${orders.factuurnummer} is not null and ${orders.status} = 'nieuw')`.mapWith(Number),
    })
    .from(orders);

  const [retour] = await db
    .select({
      beoordelen: sql<number>`count(*) filter (where ${returns.status} = 'aangemeld')`.mapWith(Number),
      terugbetalen: sql<number>`count(*) filter (where ${returns.status} = 'ontvangen')`.mapWith(Number),
    })
    .from(returns);

  const [aanvragen] = await db
    .select({ aantal: count() })
    .from(affiliates)
    .where(eq(affiliates.status, "aangevraagd"));

  const [recall] = await db
    .select({ aantal: count() })
    .from(recalls)
    .where(isNull(recalls.geslotenOp));

  return {
    versturen: bestel?.versturen ?? 0,
    onderwegLang: bestel?.onderwegLang ?? 0,
    openFacturen: bestel?.openFacturen ?? 0,
    retourBeoordelen: retour?.beoordelen ?? 0,
    retourTerugbetalen: retour?.terugbetalen ?? 0,
    affiliateAanvragen: Number(aanvragen?.aantal ?? 0),
    openRecalls: Number(recall?.aantal ?? 0),
  };
}

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
