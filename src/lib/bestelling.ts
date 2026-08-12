import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderLines, orders, products } from "@/db/schema";
import { berekenWagen, type Winkelwagen } from "./winkelwagen";


/**
 * Turning a basket into an order.
 *
 * Everything here is recomputed from the database and the catalogue. The
 * browser sends slugs, quantities and an address — never prices, never a
 * total. That is the only way the amount charged can be trusted.
 */

export type BesteladresInvoer = {
  email: string;
  landcode: string;
  postcode: string;
  huisnummer: string;
  straat?: string;
  plaats?: string;
  isZakelijk: boolean;
  bedrijfsnaam?: string;
  btwId?: string;
  btwIdGevalideerd: boolean;
};

export class BestellingGeweigerd extends Error {
  constructor(
    message: string,
    readonly oplossing?: string,
  ) {
    super(message);
    this.name = "BestellingGeweigerd";
  }
}

/**
 * BB-2026-000123. The counter is per calendar year and derived from the
 * highest existing number, inside the same transaction as the insert, so
 * two simultaneous checkouts cannot claim the same number.
 */
async function volgendOrdernummer(tx: typeof db, jaar: number): Promise<string> {
  const prefix = `BB-${jaar}-`;
  const [rij] = await tx
    .select({
      hoogste: sql<string | null>`max(${orders.ordernummer})`,
    })
    .from(orders)
    .where(sql`${orders.ordernummer} like ${prefix + "%"}`);

  const vorig = rij?.hoogste ? Number(rij.hoogste.slice(prefix.length)) : 0;
  const volgend = (Number.isFinite(vorig) ? vorig : 0) + 1;
  return prefix + String(volgend).padStart(6, "0");
}

export type AangemaakteBestelling = {
  id: string;
  ordernummer: string;
  totaalInclBtwCenten: number;
};

export async function maakBestelling(
  wagen: Winkelwagen,
  adres: BesteladresInvoer,
  userId?: string,
): Promise<AangemaakteBestelling> {
  const overzicht = berekenWagen(wagen, {
    landcode: adres.landcode,
    isZakelijk: adres.isZakelijk,
    btwIdGevalideerd: adres.btwIdGevalideerd,
  });

  if (overzicht.leeg) {
    throw new BestellingGeweigerd("Je winkelwagen is leeg.");
  }

  // §15: never accept an order we cannot ship. Checked again here, not
  // only in the UI — a stale page or a crafted request must not get through.
  if (!overzicht.verzending.toegestaan) {
    throw new BestellingGeweigerd(
      overzicht.verzending.reden,
      overzicht.verzending.oplossing,
    );
  }

  return db.transaction(async (tx) => {
    const ordernummer = await volgendOrdernummer(
      tx as unknown as typeof db,
      new Date().getFullYear(),
    );

    const [order] = await tx
      .insert(orders)
      .values({
        ordernummer,
        userId: userId ?? null,
        gastEmail: userId ? null : adres.email,
        status: "nieuw",
        subtotaalExclBtwCenten: overzicht.totalen.subtotaalExclBtwCenten,
        btwBedragCenten: overzicht.totalen.btwBedragCenten,
        verzendkostenCenten: overzicht.totalen.verzendkostenCenten,
        totaalInclBtwCenten: overzicht.totalen.totaalInclBtwCenten,
        btwVerlegd: overzicht.totalen.btwVerlegd,
        landcode: adres.landcode.toUpperCase(),
        postcode: adres.postcode,
        huisnummer: adres.huisnummer,
        straat: adres.straat ?? null,
        plaats: adres.plaats ?? null,
        verzendregelToegepast: `gratis verzending · ${overzicht.aantalModules} module(s)`,
      })
      .returning({ id: orders.id, ordernummer: orders.ordernummer });

    for (const regel of overzicht.regels) {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, regel.item.slug))
        .limit(1);

      if (!product) {
        // The catalogue and the database disagree — refuse rather than
        // silently drop a line the customer thinks they bought.
        throw new BestellingGeweigerd(
          `Artikel ${regel.item.naam} is momenteel niet beschikbaar.`,
        );
      }

      const regelExcl = regel.item.prijsExclBtwCenten * regel.aantal;
      await tx.insert(orderLines).values({
        orderId: order.id,
        productId: product.id,
        aantal: regel.aantal,
        stukprijsExclBtwCenten: regel.item.prijsExclBtwCenten,
        btwBedragCenten: overzicht.totalen.btwVerlegd
          ? 0
          : Math.round((regelExcl * regel.item.btwPercentage) / 100),
      });
    }

    return {
      id: order.id,
      ordernummer: order.ordernummer,
      totaalInclBtwCenten: overzicht.totalen.totaalInclBtwCenten,
    };
  });
}

/** Order plus lines, for the confirmation page. */
export async function haalBestelling(ordernummer: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.ordernummer, ordernummer))
    .limit(1);

  if (!order) return null;

  // Join products so each line can show what was actually bought; the
  // name is read from the order's own product row, not guessed.
  const regels = await db
    .select({
      id: orderLines.id,
      aantal: orderLines.aantal,
      stukprijsExclBtwCenten: orderLines.stukprijsExclBtwCenten,
      btwBedragCenten: orderLines.btwBedragCenten,
      slug: products.slug,
      naam: products.naam,
    })
    .from(orderLines)
    .innerJoin(products, eq(products.id, orderLines.productId))
    .where(eq(orderLines.orderId, order.id));

  return { order, regels };
}

export async function markeerBetaald(
  orderId: string,
  mollieId: string,
  status: "betaald" | "geannuleerd" | "nieuw",
) {
  await db
    .update(orders)
    .set({ status, mollieId })
    .where(eq(orders.id, orderId));
}

