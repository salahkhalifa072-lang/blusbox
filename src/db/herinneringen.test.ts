import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { maakTestDb } from "./testdb";
import { herinneringsOntvangers, markeerHerinnering } from "./queries";
import type { Actor } from "./queries";
import {
  lots,
  orderLines,
  orders,
  products,
  registeredUnits,
  users,
} from "./schema";
import { verschuldigdeHerinnering, type IsoDatum } from "@/lib/levensduur";

/**
 * §9.3 vervangingsherinneringen.
 *
 * De site belooft op de homepage bericht vóórdat de termijn verloopt. Deze
 * tests bewaken die belofte aan de gegevenskant: wie is aan de beurt, komt
 * een gast er ook in, en gaat er niets twee keer weg.
 */

type Db = Awaited<ReturnType<typeof maakTestDb>>["db"];

let db: Db;

const id = {
  product: "11111111-1111-4111-8111-111111111111",
  lot: "22222222-2222-4222-8222-222222222222",
  klant: "33333333-3333-4333-8333-111111111111",
  orderKlant: "44444444-4444-4444-8444-111111111111",
  orderGast: "44444444-4444-4444-8444-222222222222",
  lijnKlant: "55555555-5555-4555-8555-111111111111",
  lijnGast: "55555555-5555-4555-8555-222222222222",
  unitKlant: "66666666-6666-4666-8666-111111111111",
  unitGast: "66666666-6666-4666-8666-222222222222",
  unitVer: "66666666-6666-4666-8666-333333333333",
};

const admin: Actor = { id: "admin-1", rol: "admin" };
const VANDAAG = "2026-08-12" as IsoDatum;

beforeEach(async () => {
  ({ db } = await maakTestDb());

  await db.insert(products).values({
    id: id.product,
    slug: "blusbox",
    naam: "Blusbox",
    prijsExclBtwCenten: 2393,
  });
  await db.insert(lots).values({
    id: id.lot,
    lotNummer: "LOT-2016-A",
    productId: id.product,
    productiedatum: "2016-01-15",
    aantal: 500,
  });
  await db.insert(users).values({
    id: id.klant,
    email: "anna@example.nl",
    name: "Anna de Vries",
  });

  const totalen = {
    subtotaalExclBtwCenten: 2393,
    btwBedragCenten: 502,
    totaalInclBtwCenten: 2895,
  };
  await db.insert(orders).values([
    {
      id: id.orderKlant,
      ordernummer: "BB-2016-000001",
      userId: id.klant,
      status: "geleverd",
      postcode: "1011AB",
      ...totalen,
    },
    {
      id: id.orderGast,
      ordernummer: "BB-2016-000002",
      gastEmail: "gast@example.nl",
      status: "geleverd",
      postcode: "3011AB",
      ...totalen,
    },
  ]);
  await db.insert(orderLines).values([
    {
      id: id.lijnKlant,
      orderId: id.orderKlant,
      productId: id.product,
      lotId: id.lot,
      aantal: 1,
      stukprijsExclBtwCenten: 2393,
      btwBedragCenten: 502,
    },
    {
      id: id.lijnGast,
      orderId: id.orderGast,
      productId: id.product,
      lotId: id.lot,
      aantal: 1,
      stukprijsExclBtwCenten: 2393,
      btwBedragCenten: 502,
    },
  ]);

  await db.insert(registeredUnits).values([
    {
      // verloopt over ~6 maanden
      id: id.unitKlant,
      orderLineId: id.lijnKlant,
      lotId: id.lot,
      userId: id.klant,
      installatiedatum: "2017-02-10",
      vervaldatum: "2027-02-10",
    },
    {
      // gast, verloopt over ~1 maand
      id: id.unitGast,
      orderLineId: id.lijnGast,
      lotId: id.lot,
      installatiedatum: "2016-09-05",
      vervaldatum: "2026-09-05",
    },
    {
      // nog ver weg
      id: id.unitVer,
      lotId: id.lot,
      installatiedatum: "2024-01-01",
      vervaldatum: "2034-01-01",
    },
  ]);
});

describe("wie is aan de beurt", () => {
  it("laat units die pas over jaren verlopen met rust", async () => {
    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    expect(rijen.map((r) => r.unitId)).not.toContain(id.unitVer);
  });

  it("bereikt ook een gast zonder account", async () => {
    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    const gast = rijen.find((r) => r.unitId === id.unitGast);
    expect(gast?.email).toBe("gast@example.nl");
  });

  it("gebruikt het accountadres als dat er is", async () => {
    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    const klant = rijen.find((r) => r.unitId === id.unitKlant);
    expect(klant?.email).toBe("anna@example.nl");
  });

  it("laat units zonder enig adres weg", async () => {
    // unitVer heeft geen orderregel en geen gebruiker, dus geen adres.
    await db
      .update(registeredUnits)
      .set({ vervaldatum: "2026-10-01" })
      .where(eq(registeredUnits.id, id.unitVer));

    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    expect(rijen.map((r) => r.unitId)).not.toContain(id.unitVer);
  });
});

describe("welke herinnering", () => {
  it("kiest de dringendste termijn die al gepasseerd is", async () => {
    // Vervalt 10-02-2027; op 12-08-2026 zijn de twaalf- en de
    // zesmaandsdatum gepasseerd, de eenmaandsdatum nog niet.
    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    const klant = rijen.find((r) => r.unitId === id.unitKlant)!;

    const maand = verschuldigdeHerinnering(klant.vervaldatum, VANDAAG, {
      12: klant.herinnering12Op !== null,
      6: klant.herinnering6Op !== null,
      1: klant.herinnering1Op !== null,
    });
    expect(maand).toBe(6);
  });

  it("vertelt een gast met een bijna verlopen module niet dat het nog een jaar duurt", async () => {
    // Vervalt 05-09-2026, dus over drie weken. Alle drie de momenten zijn
    // gepasseerd; alleen het eenmaandsbericht klopt nog.
    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    const gast = rijen.find((r) => r.unitId === id.unitGast)!;

    const maand = verschuldigdeHerinnering(gast.vervaldatum, VANDAAG, {
      12: false,
      6: false,
      1: false,
    });
    expect(maand).toBe(1);
  });
});

describe("niet twee keer", () => {
  it("stempelt de verstuurde herinnering", async () => {
    await markeerHerinnering(id.unitKlant, 12, db);

    const [rij] = await db
      .select({
        twaalf: registeredUnits.herinnering12Op,
        zes: registeredUnits.herinnering6Op,
        een: registeredUnits.herinnering1Op,
      })
      .from(registeredUnits)
      .where(eq(registeredUnits.id, id.unitKlant));

    expect(rij.twaalf).toBeInstanceOf(Date);
    // De andere twee blijven open: die zijn later aan de beurt.
    expect(rij.zes).toBeNull();
    expect(rij.een).toBeNull();
  });

  it("laat een gestempelde herinnering niet nog eens aan de beurt komen", async () => {
    // Zes is verstuurd, twaalf is daarmee achterhaald: er staat niets meer
    // open tot de eenmaandsdatum in januari.
    await markeerHerinnering(id.unitKlant, 6, db);
    await markeerHerinnering(id.unitKlant, 12, db);

    const rijen = await herinneringsOntvangers(admin, VANDAAG, db);
    const klant = rijen.find((r) => r.unitId === id.unitKlant)!;

    const maand = verschuldigdeHerinnering(klant.vervaldatum, VANDAAG, {
      12: klant.herinnering12Op !== null,
      6: klant.herinnering6Op !== null,
      1: klant.herinnering1Op !== null,
    });
    expect(maand).toBeNull();
  });

  it("raakt andere units niet", async () => {
    await markeerHerinnering(id.unitKlant, 12, db);

    const [gast] = await db
      .select({ twaalf: registeredUnits.herinnering12Op })
      .from(registeredUnits)
      .where(eq(registeredUnits.id, id.unitGast));
    expect(gast.twaalf).toBeNull();
  });
});
