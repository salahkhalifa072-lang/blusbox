import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { maakTestDb } from "./testdb";
import {
  FactuurGeweigerd,
  factuurLijst,
  haalFactuur,
  maakBalieFactuur,
  markeerFactuurBetaald,
  type BalieFactuurInvoer,
} from "./facturen";
import { orderLines, orders, products } from "./schema";

type Db = Awaited<ReturnType<typeof maakTestDb>>["db"];
let db: Db;

const invoer: BalieFactuurInvoer = {
  klantNaam: "Anna de Vries",
  email: "anna@example.nl",
  straat: "Kerkstraat",
  huisnummer: "12",
  postcode: "3511 AB",
  plaats: "Utrecht",
  leverdatum: "2026-09-23",
  regels: [{ slug: "blusbox", aantal: 2, stukprijsInclBtwCenten: 2999 }],
};

beforeAll(async () => {
  ({ db } = await maakTestDb());
  await db.insert(products).values({
    slug: "blusbox",
    naam: "Blusbox blusmodule",
    prijsExclBtwCenten: 2479,
    btwPercentage: 21,
  });
});

describe("balieverkoop met factuur", () => {
  it("maakt een bestelling met doorlopend factuurnummer", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eerste = await maakBalieFactuur(invoer, db as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tweede = await maakBalieFactuur(invoer, db as any);

    const jaar = new Date().getFullYear();
    expect(eerste.factuurnummer).toBe(`F-${jaar}-0001`);
    expect(tweede.factuurnummer).toBe(`F-${jaar}-0002`);
    expect(eerste.ordernummer).not.toBe(tweede.ordernummer);
    expect(eerste.betaaltoken).not.toBe(tweede.betaaltoken);
    expect(eerste.betaaltoken.length).toBeGreaterThanOrEqual(30);
    expect(eerste.totaalInclBtwCenten).toBe(5998);

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, eerste.orderId));
    expect(order.balieverkoop).toBe(true);
    expect(order.status).toBe("nieuw");
    expect(order.gastEmail).toBe("anna@example.nl");
    expect(order.subtotaalExclBtwCenten + order.btwBedragCenten).toBe(5998);

    // De regel hangt aan het product: nodig voor lot en terugroepactie.
    const regels = await db
      .select()
      .from(orderLines)
      .where(eq(orderLines.orderId, eerste.orderId));
    expect(regels).toHaveLength(1);
    expect(regels[0].aantal).toBe(2);
  });

  it("leest de factuur terug met exact hetzelfde bedrag", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nieuw = await maakBalieFactuur(invoer, db as any);
    const viaNummer = await haalFactuur(
      { factuurnummer: nieuw.factuurnummer },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
    );
    const viaToken = await haalFactuur(
      { betaaltoken: nieuw.betaaltoken },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
    );

    expect(viaNummer?.totalen.totaalInclBtwCenten).toBe(5998);
    expect(viaNummer?.totalen.btwBedragCenten).toBe(1041);
    expect(viaNummer?.leverdatum).toBe("2026-09-23");
    expect(viaToken?.factuurnummer).toBe(nieuw.factuurnummer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await haalFactuur({ betaaltoken: "bestaat-niet" }, db as any)).toBeNull();
  });

  it("zet een betaalde factuur één keer op geleverd", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = await maakBalieFactuur(invoer, db as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await markeerFactuurBetaald(f.orderId, "cs_1", db as any)).toBe(true);
    // Stripe levert een gebeurtenis soms twee keer: dan niet opnieuw mailen.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await markeerFactuurBetaald(f.orderId, "cs_1", db as any)).toBe(false);

    const [order] = await db.select().from(orders).where(eq(orders.id, f.orderId));
    expect(order.status).toBe("geleverd");
  });

  it("weigert een factuur zonder regels of met een onbekend artikel", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maakBalieFactuur({ ...invoer, regels: [] }, db as any),
    ).rejects.toBeInstanceOf(FactuurGeweigerd);
    await expect(
      maakBalieFactuur(
        { ...invoer, regels: [{ slug: "bestaat-niet", aantal: 1, stukprijsInclBtwCenten: 100 }] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db as any,
      ),
    ).rejects.toBeInstanceOf(FactuurGeweigerd);
  });

  it("toont alleen bestellingen met een factuur in de lijst", async () => {
    await db.insert(orders).values({
      ordernummer: "BB-2000-000001",
      subtotaalExclBtwCenten: 1,
      btwBedragCenten: 0,
      totaalInclBtwCenten: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lijst = await factuurLijst(100, db as any);
    expect(lijst.every((f) => f.factuurnummer)).toBe(true);
    expect(lijst.length).toBeGreaterThan(0);
  });
});
