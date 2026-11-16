import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { maakTestDb } from "./testdb";
import {
  annuleerDeurverkoop,
  deurverkopen,
  haalDeurverkoop,
  koppelDeurSessie,
  maakDeurverkoop,
  markeerDeurverkoopBetaald,
  type DeurverkoopInvoer,
} from "./deurverkoop";
import { orders, products, users } from "./schema";

type Db = Awaited<ReturnType<typeof maakTestDb>>["db"];
let db: Db;
let verkoper: string;
let collega: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const h = () => db as any;

const invoer = (): DeurverkoopInvoer => ({
  verkoperId: verkoper,
  klantNaam: "Kees Jansen",
  email: "kees@example.nl",
  straat: "Dorpsstraat",
  huisnummer: "4",
  postcode: "4331 AA",
  plaats: "Middelburg",
  regels: [{ slug: "blusbox", aantal: 1, stukprijsInclBtwCenten: 4950 }],
});

beforeAll(async () => {
  ({ db } = await maakTestDb());
  await db.insert(products).values({
    slug: "blusbox",
    naam: "Blusbox blusmodule",
    prijsExclBtwCenten: 4091,
    btwPercentage: 21,
  });
  const [a, b] = await db
    .insert(users)
    .values([
      { email: "verkoper@example.nl", rol: "verkoper" },
      { email: "collega@example.nl", rol: "verkoper" },
    ])
    .returning({ id: users.id });
  verkoper = a.id;
  collega = b.id;
});

describe("deurverkoop", () => {
  it("factureert pas bij betaling, zonder gat na een afgebroken verkoop", async () => {
    const afgebroken = await maakDeurverkoop(invoer(), h());
    const betaald = await maakDeurverkoop(invoer(), h());
    expect(betaald.totaalInclBtwCenten).toBe(4950);

    const [voor] = await db.select().from(orders).where(eq(orders.id, betaald.orderId));
    expect(voor.factuurnummer).toBeNull();
    expect(voor.verkoperId).toBe(verkoper);

    expect(await annuleerDeurverkoop(afgebroken.orderId, h())).toBe(true);
    await koppelDeurSessie(betaald.orderId, "cs_1", h());
    expect(await markeerDeurverkoopBetaald(betaald.orderId, "cs_1", h())).toBe("voldaan");

    const [na] = await db.select().from(orders).where(eq(orders.id, betaald.orderId));
    const jaar = new Date().getFullYear();
    expect(na.factuurnummer).toBe(`F-${jaar}-0001`);
    expect(na.status).toBe("geleverd");
    expect(na.geleverdOp).not.toBeNull();
  });

  it("herkent een herhaalde melding en een tweede betaling", async () => {
    const v = await maakDeurverkoop(invoer(), h());
    expect(await markeerDeurverkoopBetaald(v.orderId, "cs_a", h())).toBe("voldaan");
    expect(await markeerDeurverkoopBetaald(v.orderId, "cs_a", h())).toBe("herhaald");
    expect(await markeerDeurverkoopBetaald(v.orderId, "cs_b", h())).toBe("dubbel");
    expect(await annuleerDeurverkoop(v.orderId, h())).toBe(false);
  });

  it("laat een verkoper alleen zijn eigen verkopen zien", async () => {
    const v = await maakDeurverkoop(invoer(), h());
    expect(await haalDeurverkoop(v.ordernummer, { id: verkoper, rol: "verkoper" }, h())).not.toBeNull();
    expect(await haalDeurverkoop(v.ordernummer, { id: collega, rol: "verkoper" }, h())).toBeNull();
    expect(await haalDeurverkoop(v.ordernummer, { id: collega, rol: "admin" }, h())).not.toBeNull();
    expect(await deurverkopen({ id: collega, rol: "verkoper" }, 30, h())).toHaveLength(0);
  });
});

describe("contant aan de deur", () => {
  it("rondt af met factuurnummer en onthoudt dat het contant was", async () => {
    const v = await maakDeurverkoop(invoer(), h());
    expect(await markeerDeurverkoopBetaald(v.orderId, `contant:${verkoper}`, h())).toBe("voldaan");
    const d = await haalDeurverkoop(v.ordernummer, { id: verkoper, rol: "verkoper" }, h());
    expect(d?.contant).toBe(true);
    expect(d?.factuurnummer).toMatch(/^F-\d{4}-\d{4}$/);
    // Een late kaartbetaling op dezelfde verkoop is een dubbele betaling.
    expect(await markeerDeurverkoopBetaald(v.orderId, "cs_laat", h())).toBe("dubbel");
  });
});
