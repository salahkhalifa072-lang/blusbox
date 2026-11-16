import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { orderLines, orders, products } from "./schema";
import { volgendOrdernummer } from "./nummers";
import { isUniekConflict, volgendVrijFactuurnummer, type FactuurBetaling } from "./facturen";
import { berekenFactuur, datumNl } from "@/lib/factuur";
import { isContant } from "@/lib/contant";

/**
 * Verkoop aan de deur.
 *
 * Net als een balieverkoop een gewone bestelling met regels — zo zit deze
 * klant ook in een terugroepactie — maar met één verschil in volgorde:
 * hier wordt eerst betaald en dan pas gefactureerd. Het factuurnummer komt
 * er bij de betaling bij. Haakt een klant aan de deur af, dan blijft er
 * een geannuleerde bestelling over en geen factuur die gecrediteerd moet
 * worden, en blijft de reeks doorlopend (art. 35a Wet OB).
 *
 * Prijzen komen uit de catalogus, niet uit het formulier: een verkoper
 * kan geen eigen bedrag invullen.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<any, any, any>;

async function appDb(): Promise<Db> {
  const { db } = await import("./index");
  return db as unknown as Db;
}

export class DeurverkoopGeweigerd extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeurverkoopGeweigerd";
  }
}

export type DeurverkoopInvoer = {
  verkoperId: string;
  klantNaam: string;
  bedrijfsnaam?: string;
  email: string;
  straat: string;
  huisnummer: string;
  postcode: string;
  plaats: string;
  regels: { slug: string; aantal: number; stukprijsInclBtwCenten: number }[];
  /** Korting die de verkoper gaf; de stukprijzen hierboven zijn al verlaagd. */
  kortingCenten?: number;
};

export async function maakDeurverkoop(
  invoer: DeurverkoopInvoer,
  handle?: Db,
): Promise<{ orderId: string; ordernummer: string; totaalInclBtwCenten: number }> {
  const db = handle ?? (await appDb());
  const regels = invoer.regels.filter((r) => r.aantal > 0);
  if (regels.length === 0) throw new DeurverkoopGeweigerd("Kies minstens één artikel.");
  const jaar = Number(datumNl(new Date()).slice(0, 4));

  return db.transaction(async (tx) => {
    const gevonden = await tx
      .select({
        id: products.id,
        slug: products.slug,
        naam: products.naam,
        btwPercentage: products.btwPercentage,
      })
      .from(products)
      .where(inArray(products.slug, regels.map((r) => r.slug)));
    const perSlug = new Map(gevonden.map((p) => [p.slug, p]));
    const metProduct = regels.map((r) => {
      const product = perSlug.get(r.slug);
      if (!product) throw new DeurverkoopGeweigerd(`Artikel ${r.slug} bestaat niet.`);
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
    const [order] = await tx
      .insert(orders)
      .values({
        ordernummer,
        gastEmail: invoer.email,
        klantNaam: invoer.klantNaam,
        bedrijfsnaam: invoer.bedrijfsnaam || null,
        status: "nieuw",
        balieverkoop: true,
        verkoperId: invoer.verkoperId,
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
        verzendregelToegepast: "deurverkoop · meegegeven",
        // Zelfde velden als een kortingscode, zodat de korting in het
        // dashboard en de omzetcijfers op dezelfde plek staat.
        ...(invoer.kortingCenten && invoer.kortingCenten > 0
          ? { kortingscode: "DEURKORTING", kortingBedragCenten: invoer.kortingCenten }
          : {}),
        // Niet te raden; nodig omdat de factuurroutes erop leunen.
        betaaltoken: randomBytes(24).toString("base64url"),
      })
      .returning({ id: orders.id });

    for (const [i, r] of metProduct.entries()) {
      const berekend = totalen.regels[i];
      await tx.insert(orderLines).values({
        orderId: order.id,
        productId: r.product.id,
        aantal: r.aantal,
        stukprijsExclBtwCenten: berekend.stukprijsExclBtwCenten,
        // Zelfde afspraak als bij de balieverkoop: stukprijs × aantal + btw
        // is precies het brutobedrag van de regel.
        btwBedragCenten: berekend.regelInclBtwCenten - berekend.stukprijsExclBtwCenten * r.aantal,
      });
    }

    return { orderId: order.id, ordernummer, totaalInclBtwCenten: totalen.totaalInclBtwCenten };
  });
}

/**
 * Betaling binnen: status naar geleverd (de klant heeft de module in
 * handen) en in dezelfde transactie het factuurnummer. Zo bestaat er nooit
 * een betaalde deurverkoop zonder factuur of een factuur zonder betaling.
 * Zelfde uitkomsten als markeerFactuurBetaald.
 */
export async function markeerDeurverkoopBetaald(
  orderId: string,
  sessieId: string,
  handle?: Db,
): Promise<FactuurBetaling> {
  const db = handle ?? (await appDb());
  const nu = new Date();
  const jaar = Number(datumNl(nu).slice(0, 4));

  for (let poging = 1; ; poging++) {
    try {
      const bijgewerkt = await db.transaction(async (tx) => {
        const open = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(and(eq(orders.id, orderId), eq(orders.status, "nieuw")))
          .limit(1);
        if (open.length === 0) return false;
        const factuurnummer = await volgendVrijFactuurnummer(tx, jaar);
        const rijen = await tx
          .update(orders)
          .set({
            status: "geleverd",
            mollieId: sessieId,
            geleverdOp: nu,
            factuurnummer,
            gefactureerdOp: nu,
          })
          .where(sql`${orders.id} = ${orderId} and ${orders.status} = 'nieuw'`)
          .returning({ id: orders.id });
        return rijen.length > 0;
      });
      if (bijgewerkt) return "voldaan";
      break;
    } catch (fout) {
      if (poging < 3 && isUniekConflict(fout)) continue;
      throw fout;
    }
  }

  const [order] = await db
    .select({ sessie: orders.mollieId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return order?.sessie === sessieId ? "herhaald" : "dubbel";
}

export type Deurverkoop = {
  orderId: string;
  ordernummer: string;
  status: string;
  factuurnummer: string | null;
  klantNaam: string;
  email: string | null;
  adres: string;
  totaalInclBtwCenten: number;
  kortingCenten: number;
  /** Contant afgerekend; het geld is bij de verkoper. */
  contant: boolean;
  stripeSessie: string | null;
  /** Voor de korte betaallink achter de QR-code. */
  betaaltoken: string | null;
  verkoperId: string | null;
  aangemaakt: Date;
  regels: { naam: string; aantal: number; regelInclBtwCenten: number }[];
};

/** Eén deurverkoop, alleen voor wie hem invoerde (of de admin). */
export async function haalDeurverkoop(
  ordernummer: string,
  actor: { id: string; rol: string },
  handle?: Db,
): Promise<Deurverkoop | null> {
  const db = handle ?? (await appDb());
  const [o] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.ordernummer, ordernummer), sql`${orders.verkoperId} is not null`))
    .limit(1);
  if (!o) return null;
  if (actor.rol !== "admin" && o.verkoperId !== actor.id) return null;

  const lijnen = await db
    .select({
      naam: products.naam,
      aantal: orderLines.aantal,
      excl: orderLines.stukprijsExclBtwCenten,
      btw: orderLines.btwBedragCenten,
    })
    .from(orderLines)
    .innerJoin(products, eq(products.id, orderLines.productId))
    .where(eq(orderLines.orderId, o.id));

  return {
    orderId: o.id,
    ordernummer: o.ordernummer,
    status: o.status,
    factuurnummer: o.factuurnummer,
    klantNaam: o.klantNaam ?? "",
    email: o.gastEmail,
    adres: [[o.straat, o.huisnummer].filter(Boolean).join(" "), [o.postcode, o.plaats].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", "),
    totaalInclBtwCenten: o.totaalInclBtwCenten,
    kortingCenten: o.kortingBedragCenten,
    contant: isContant(o.mollieId),
    stripeSessie: o.mollieId,
    betaaltoken: o.betaaltoken,
    verkoperId: o.verkoperId,
    aangemaakt: o.geplaatstOp,
    regels: lijnen.map((l) => ({
      naam: l.naam,
      aantal: l.aantal,
      regelInclBtwCenten: l.excl * l.aantal + l.btw,
    })),
  };
}

/** De laatste deurverkopen; een verkoper ziet alleen de zijne. */
export async function deurverkopen(
  actor: { id: string; rol: string },
  limiet = 30,
  handle?: Db,
) {
  const db = handle ?? (await appDb());
  return db
    .select({
      ordernummer: orders.ordernummer,
      status: orders.status,
      factuurnummer: orders.factuurnummer,
      klantNaam: orders.klantNaam,
      plaats: orders.plaats,
      totaalCenten: orders.totaalInclBtwCenten,
      geplaatstOp: orders.geplaatstOp,
      betaalreferentie: orders.mollieId,
    })
    .from(orders)
    .where(
      actor.rol === "admin"
        ? sql`${orders.verkoperId} is not null`
        : eq(orders.verkoperId, actor.id),
    )
    .orderBy(desc(orders.geplaatstOp))
    .limit(limiet);
}

/** Nieuwe betaalsessie koppelen, alleen zolang er nog niet betaald is. */
export async function koppelDeurSessie(orderId: string, sessieId: string, handle?: Db) {
  const db = handle ?? (await appDb());
  const r = await db
    .update(orders)
    .set({ mollieId: sessieId })
    .where(sql`${orders.id} = ${orderId} and ${orders.status} = 'nieuw'`)
    .returning({ id: orders.id });
  return r.length > 0;
}

/** Afgebroken aan de deur: annuleren kan alleen zolang er niet betaald is. */
export async function annuleerDeurverkoop(orderId: string, handle?: Db) {
  const db = handle ?? (await appDb());
  const r = await db
    .update(orders)
    .set({ status: "geannuleerd" })
    .where(sql`${orders.id} = ${orderId} and ${orders.status} = 'nieuw' and ${orders.factuurnummer} is null`)
    .returning({ id: orders.id });
  return r.length > 0;
}
