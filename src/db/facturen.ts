import { randomBytes } from "node:crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { orderLines, orders, products } from "./schema";
import { volgendOrdernummer } from "./nummers";
import {
  berekenFactuur,
  volgendFactuurnummer,
  type FactuurTotalen,
} from "@/lib/factuur";
import type { IsoDatum } from "@/lib/levensduur";

/**
 * Balieverkoop met factuur (§9.5-afhandeling).
 *
 * Een balieverkoop is gewoon een bestelling, met regels en producten. Dat
 * is geen gemakzucht: aan die regels hangt later het lotnummer, en daarmee
 * zit deze klant in een terugroepactie net als iedereen die online kocht.
 * Een losse "facturen"-tabel zou dat pad missen.
 *
 * Elke functie neemt de databasehandle als laatste argument, zoals in
 * db/queries.ts, zodat de tests tegen een echte Postgres-engine draaien.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<any, any, any>;

async function appDb(): Promise<Db> {
  const { db } = await import("./index");
  return db as unknown as Db;
}

export class FactuurGeweigerd extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FactuurGeweigerd";
  }
}

export type BalieFactuurInvoer = {
  klantNaam: string;
  bedrijfsnaam?: string;
  email: string;
  straat: string;
  huisnummer: string;
  postcode: string;
  plaats: string;
  leverdatum: IsoDatum;
  regels: { slug: string; aantal: number; stukprijsInclBtwCenten: number }[];
};

export type AangemaakteFactuur = {
  orderId: string;
  ordernummer: string;
  factuurnummer: string;
  betaaltoken: string;
  totaalInclBtwCenten: number;
};

export async function maakBalieFactuur(
  invoer: BalieFactuurInvoer,
  handle?: Db,
): Promise<AangemaakteFactuur> {
  const db = handle ?? (await appDb());
  const regels = invoer.regels.filter((r) => r.aantal > 0);
  if (regels.length === 0) {
    throw new FactuurGeweigerd("Er staat niets op de factuur.");
  }

  const nu = new Date();
  const jaar = nu.getFullYear();

  return db.transaction(async (tx) => {
    const gevonden = await tx
      .select({
        id: products.id,
        slug: products.slug,
        naam: products.naam,
        btwPercentage: products.btwPercentage,
      })
      .from(products)
      .where(
        inArray(
          products.slug,
          regels.map((r) => r.slug),
        ),
      );

    const perSlug = new Map(gevonden.map((p) => [p.slug, p]));
    const metProduct = regels.map((r) => {
      const product = perSlug.get(r.slug);
      if (!product) {
        throw new FactuurGeweigerd(`Artikel ${r.slug} bestaat niet in de database.`);
      }
      return { ...r, product };
    });

    const totalen = berekenFactuur(
      metProduct.map((r) => ({
        naam: r.product.naam,
        aantal: r.aantal,
        stukprijsInclBtwCenten: r.stukprijsInclBtwCenten,
        btwPercentage: r.product.btwPercentage,
      })),
    );

    const ordernummer = await volgendOrdernummer(tx, jaar);
    const [hoogste] = await tx
      .select({ nummer: sql<string | null>`max(${orders.factuurnummer})` })
      .from(orders)
      .where(sql`${orders.factuurnummer} like ${`F-${jaar}-%`}`);
    const factuurnummer = volgendFactuurnummer(jaar, hoogste?.nummer);
    const betaaltoken = randomBytes(24).toString("base64url");

    const [order] = await tx
      .insert(orders)
      .values({
        ordernummer,
        gastEmail: invoer.email,
        klantNaam: invoer.klantNaam,
        bedrijfsnaam: invoer.bedrijfsnaam || null,
        status: "nieuw",
        balieverkoop: true,
        subtotaalExclBtwCenten: totalen.subtotaalExclBtwCenten,
        btwBedragCenten: totalen.btwBedragCenten,
        verzendkostenCenten: 0,
        totaalInclBtwCenten: totalen.totaalInclBtwCenten,
        btwVerlegd: false,
        landcode: "NL",
        straat: invoer.straat,
        huisnummer: invoer.huisnummer,
        postcode: invoer.postcode,
        plaats: invoer.plaats,
        verzendregelToegepast: "balieverkoop · meegenomen",
        geleverdOp: new Date(`${invoer.leverdatum}T12:00:00Z`),
        factuurnummer,
        gefactureerdOp: nu,
        betaaltoken,
      })
      .returning({ id: orders.id });

    for (const [i, r] of metProduct.entries()) {
      const berekend = totalen.regels[i];
      await tx.insert(orderLines).values({
        orderId: order.id,
        productId: r.product.id,
        aantal: r.aantal,
        stukprijsExclBtwCenten: berekend.stukprijsExclBtwCenten,
        // Zo gekozen dat stukprijs × aantal + btw precies het brutobedrag
        // van de regel is; haalFactuur rekent daaruit terug. Het kan een
        // cent schelen met de btw op de factuur (die komt uit splitsIncl
        // over het regeltotaal), maar de factuur is het document dat telt
        // en die wordt altijd uit het brutobedrag opgebouwd.
        btwBedragCenten:
          berekend.regelInclBtwCenten -
          berekend.stukprijsExclBtwCenten * r.aantal,
      });
    }

    return {
      orderId: order.id,
      ordernummer,
      factuurnummer,
      betaaltoken,
      totaalInclBtwCenten: totalen.totaalInclBtwCenten,
    };
  });
}

export type Factuur = {
  orderId: string;
  ordernummer: string;
  factuurnummer: string;
  betaaltoken: string | null;
  status: string;
  email: string | null;
  klantNaam: string;
  bedrijfsnaam: string | null;
  straat: string;
  huisnummer: string;
  postcode: string;
  plaats: string;
  factuurdatum: IsoDatum;
  leverdatum: IsoDatum;
  totalen: FactuurTotalen;
};

/** Eén factuur, via het factuurnummer of het betaaltoken. */
export async function haalFactuur(
  zoek: { factuurnummer: string } | { betaaltoken: string },
  handle?: Db,
): Promise<Factuur | null> {
  const db = handle ?? (await appDb());
  const [order] = await db
    .select()
    .from(orders)
    .where(
      "factuurnummer" in zoek
        ? eq(orders.factuurnummer, zoek.factuurnummer)
        : eq(orders.betaaltoken, zoek.betaaltoken),
    )
    .limit(1);
  if (!order?.factuurnummer || !order.gefactureerdOp) return null;

  const lijnen = await db
    .select({
      naam: products.naam,
      aantal: orderLines.aantal,
      stukprijsExclBtwCenten: orderLines.stukprijsExclBtwCenten,
      btwBedragCenten: orderLines.btwBedragCenten,
      btwPercentage: products.btwPercentage,
    })
    .from(orderLines)
    .innerJoin(products, eq(products.id, orderLines.productId))
    .where(eq(orderLines.orderId, order.id));

  // De regels worden opnieuw doorgerekend in plaats van uit losse kolommen
  // gelezen: het brutobedrag per regel staat niet in de tabel. Terugrekenen
  // uit netto + btw geeft exact het bedrag dat bij het aanmaken gold.
  const totalen = berekenFactuur(
    lijnen.map((l) => ({
      naam: l.naam,
      aantal: l.aantal,
      stukprijsInclBtwCenten:
        (l.stukprijsExclBtwCenten * l.aantal + l.btwBedragCenten) / l.aantal,
      btwPercentage: l.btwPercentage,
    })),
  );

  return {
    orderId: order.id,
    ordernummer: order.ordernummer,
    factuurnummer: order.factuurnummer,
    betaaltoken: order.betaaltoken,
    status: order.status,
    email: order.gastEmail,
    klantNaam: order.klantNaam ?? "",
    bedrijfsnaam: order.bedrijfsnaam,
    straat: order.straat ?? "",
    huisnummer: order.huisnummer ?? "",
    postcode: order.postcode ?? "",
    plaats: order.plaats ?? "",
    factuurdatum: order.gefactureerdOp.toISOString().slice(0, 10),
    leverdatum: (order.geleverdOp ?? order.gefactureerdOp)
      .toISOString()
      .slice(0, 10),
    totalen,
  };
}

export async function factuurLijst(limiet = 100, handle?: Db) {
  const db = handle ?? (await appDb());
  return db
    .select({
      ordernummer: orders.ordernummer,
      factuurnummer: orders.factuurnummer,
      status: orders.status,
      klantNaam: orders.klantNaam,
      bedrijfsnaam: orders.bedrijfsnaam,
      email: orders.gastEmail,
      totaalCenten: orders.totaalInclBtwCenten,
      gefactureerdOp: orders.gefactureerdOp,
    })
    .from(orders)
    .where(sql`${orders.factuurnummer} is not null`)
    .orderBy(desc(orders.gefactureerdOp))
    .limit(limiet);
}

/**
 * Betaling binnen via de factuurlink.
 *
 * Status gaat naar "geleverd" en niet naar "betaald": de klant heeft de
 * module al. Op "betaald" zou de bestelling in het dashboard als te
 * verzenden verschijnen, en dan gaat er een verzendbericht uit voor een
 * pakket dat nooit bestaat.
 *
 * Geeft terug of dit de eerste keer was, zodat de webhook bij een
 * herhaalde levering van Stripe niet opnieuw mailt.
 */
export async function markeerFactuurBetaald(
  orderId: string,
  sessieId: string,
  handle?: Db,
): Promise<boolean> {
  const db = handle ?? (await appDb());
  const bijgewerkt = await db
    .update(orders)
    .set({ status: "geleverd", mollieId: sessieId })
    .where(sql`${orders.id} = ${orderId} and ${orders.status} = 'nieuw'`)
    .returning({ id: orders.id });
  return bijgewerkt.length > 0;
}
