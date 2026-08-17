import { beforeAll, describe, expect, it } from "vitest";
import { maakTestDb } from "./testdb";
import {
  afnemersVanLot,
  recallOntvangers,
  aantalVerlooptBinnen,
  unitsMetVerlopenHerinnering,
  zichtbareUnits,
  type Actor,
} from "./queries";
import {
  lots,
  orderLines,
  orders,
  products,
  registeredUnits,
  users,
} from "./schema";
import { GeenToegangError } from "@/lib/rollen";
import { berekenVervaldatum } from "@/lib/levensduur";

/**
 * §15 definition of done: "a recall from lot number to notified customer
 * list works end to end". These run the real queries against a real
 * Postgres engine (PGlite), not against mocks.
 */

type Db = Awaited<ReturnType<typeof maakTestDb>>["db"];

let db: Db;
const id = {
  product: "11111111-1111-4111-8111-111111111111",
  lotA: "22222222-2222-4222-8222-222222222222",
  lotB: "22222222-2222-4222-8222-333333333333",
  klantAnna: "33333333-3333-4333-8333-111111111111",
  klantBram: "33333333-3333-4333-8333-222222222222",
  installateur: "33333333-3333-4333-8333-333333333333",
  orderAnna: "44444444-4444-4444-8444-111111111111",
  orderGast: "44444444-4444-4444-8444-222222222222",
  orderBram: "44444444-4444-4444-8444-333333333333",
  lijnAnna: "55555555-5555-4555-8555-111111111111",
  lijnGast: "55555555-5555-4555-8555-222222222222",
  lijnBram: "55555555-5555-4555-8555-333333333333",
  unitAnna: "66666666-6666-4666-8666-111111111111",
};

const admin: Actor = { id: "admin-1", rol: "admin" };
const klant: Actor = { id: id.klantAnna, rol: "klant" };

beforeAll(async () => {
  ({ db } = await maakTestDb());

  await db.insert(products).values({
    id: id.product,
    slug: "blusbox",
    naam: "Blusbox",
    prijsExclBtwCenten: 2227,
  });

  await db.insert(lots).values([
    {
      id: id.lotA,
      lotNummer: "LOT-2026-A",
      productId: id.product,
      productiedatum: "2026-01-15",
      aantal: 500,
      leverancier: "Fabrikant BV",
    },
    {
      id: id.lotB,
      lotNummer: "LOT-2026-B",
      productId: id.product,
      productiedatum: "2026-03-01",
      aantal: 500,
    },
  ]);

  await db.insert(users).values([
    { id: id.klantAnna, email: "anna@example.nl", name: "Anna de Vries" },
    { id: id.klantBram, email: "bram@example.nl", name: "Bram Jansen" },
    {
      id: id.installateur,
      email: "info@installatiebedrijf.nl",
      name: "Installatiebedrijf",
      rol: "installateur",
    },
  ]);

  const totalen = {
    subtotaalExclBtwCenten: 2227,
    btwBedragCenten: 468,
    totaalInclBtwCenten: 2695,
  };

  await db.insert(orders).values([
    {
      id: id.orderAnna,
      ordernummer: "BB-2026-000001",
      userId: id.klantAnna,
      status: "geleverd",
      postcode: "1011AB",
      ...totalen,
    },
    {
      // guest checkout — no account, but must still be reachable
      id: id.orderGast,
      ordernummer: "BB-2026-000002",
      gastEmail: "gast@example.nl",
      status: "geleverd",
      postcode: "3011CD",
      ...totalen,
    },
    {
      id: id.orderBram,
      ordernummer: "BB-2026-000003",
      userId: id.klantBram,
      status: "geleverd",
      postcode: "9711EF",
      ...totalen,
    },
  ]);

  await db.insert(orderLines).values([
    {
      id: id.lijnAnna,
      orderId: id.orderAnna,
      productId: id.product,
      lotId: id.lotA,
      aantal: 1,
      stukprijsExclBtwCenten: 2227,
      btwBedragCenten: 468,
    },
    {
      id: id.lijnGast,
      orderId: id.orderGast,
      productId: id.product,
      lotId: id.lotA,
      aantal: 1,
      stukprijsExclBtwCenten: 2227,
      btwBedragCenten: 468,
    },
    {
      // different lot — must NOT show up in a LOT-2026-A recall
      id: id.lijnBram,
      orderId: id.orderBram,
      productId: id.product,
      lotId: id.lotB,
      aantal: 1,
      stukprijsExclBtwCenten: 2227,
      btwBedragCenten: 468,
    },
  ]);

  // Anna registered hers; the guest never did.
  await db.insert(registeredUnits).values({
    id: id.unitAnna,
    orderLineId: id.lijnAnna,
    lotId: id.lotA,
    userId: id.klantAnna,
    installateurId: id.installateur,
    installatiedatum: "2026-02-01",
    vervaldatum: berekenVervaldatum("2026-02-01"),
    locatieType: "woning",
    postcode: "1011AB",
  });
});

describe("recall: van lotnummer naar afnemers (§9.2, §15)", () => {
  it("vindt iedereen met een unit uit het lot", async () => {
    const rijen = await afnemersVanLot(admin, "LOT-2026-A", db);
    const emails = rijen.map((r) => r.email).sort();

    // One row per piece of evidence: Anna appears twice because she both
    // ordered and registered. Bram, from another lot, does not appear.
    expect(emails).toEqual([
      "anna@example.nl",
      "anna@example.nl",
      "gast@example.nl",
    ]);
  });

  it("mailt elke afnemer precies eenmaal", async () => {
    // The notification list must collapse the evidence rows, or Anna gets
    // two recall e-mails for the same module.
    const ontvangers = await recallOntvangers(admin, "LOT-2026-A", db);
    const emails = ontvangers.map((r) => r.email).sort();
    expect(emails).toEqual(["anna@example.nl", "gast@example.nl"]);
  });

  it("houdt de installatiegegevens vast bij het ontdubbelen", async () => {
    const ontvangers = await recallOntvangers(admin, "LOT-2026-A", db);
    const anna = ontvangers.find((r) => r.email === "anna@example.nl");
    // the richer of the two rows must win, so the notice can name the unit
    expect(anna?.unitId).not.toBeNull();
    expect(anna?.postcode).toBe("1011AB");
  });

  it("bereikt ook gastbestellingen zonder account", async () => {
    const rijen = await afnemersVanLot(admin, "LOT-2026-A", db);
    const gast = rijen.find((r) => r.email === "gast@example.nl");
    expect(gast).toBeDefined();
    expect(gast?.userId).toBeNull();
    expect(gast?.ordernummer).toBe("BB-2026-000002");
  });

  it("levert de installatiegegevens mee als de unit geregistreerd is", async () => {
    const rijen = await afnemersVanLot(admin, "LOT-2026-A", db);
    const anna = rijen.find(
      (r) => r.email === "anna@example.nl" && r.unitId !== null,
    );
    expect(anna?.installatiedatum).toBe("2026-02-01");
    expect(anna?.postcode).toBe("1011AB");
  });

  it("sleept geen klanten uit een ander lot mee", async () => {
    const rijen = await afnemersVanLot(admin, "LOT-2026-A", db);
    expect(rijen.map((r) => r.email)).not.toContain("bram@example.nl");
  });

  it("geeft een lege lijst voor een onbekend lotnummer", async () => {
    expect(await afnemersVanLot(admin, "LOT-BESTAAT-NIET", db)).toEqual([]);
  });

  it("weigert de vraag van een klant", async () => {
    await expect(afnemersVanLot(klant, "LOT-2026-A", db)).rejects.toThrow(
      GeenToegangError,
    );
  });
});

describe("zichtbaarheid van units (§9.7)", () => {
  it("laat de back-office alles zien", async () => {
    expect(await zichtbareUnits(admin, db)).toHaveLength(1);
  });

  it("laat een klant alleen de eigen unit zien", async () => {
    const eigen = await zichtbareUnits(
      { id: id.klantAnna, rol: "klant" },
      db,
    );
    expect(eigen).toHaveLength(1);
    expect(eigen[0].userId).toBe(id.klantAnna);
  });

  it("laat een andere klant niets zien", async () => {
    const vreemd = await zichtbareUnits(
      { id: id.klantBram, rol: "klant" },
      db,
    );
    expect(vreemd).toHaveLength(0);
  });

  it("laat een installateur de eigen geplaatste units zien", async () => {
    const geplaatst = await zichtbareUnits(
      { id: id.installateur, rol: "installateur" },
      db,
    );
    expect(geplaatst).toHaveLength(1);

    const andereInstallateur = await zichtbareUnits(
      { id: "77777777-7777-4777-8777-777777777777", rol: "installateur" },
      db,
    );
    expect(andereInstallateur).toHaveLength(0);
  });
});

describe("vervangingsherinneringen (§9.3)", () => {
  it("vindt units waarvan een herinnering openstaat", async () => {
    // vervaldatum is 2036-02-01, so the 12-month mark is 2035-02-01
    // vervaldatum is 2036-02-01, so on 2035-02-01 the twelve-month
    // reminder is exactly due.
    const openstaand = await unitsMetVerlopenHerinnering(
      admin,
      "2035-02-01",
      db,
    );
    expect(openstaand).toHaveLength(1);
    expect(openstaand[0].id).toBe(id.unitAnna);
  });

  it("vindt niets als de datums nog niet bereikt zijn", async () => {
    const openstaand = await unitsMetVerlopenHerinnering(
      admin,
      "2030-01-01",
      db,
    );
    expect(openstaand).toHaveLength(0);
  });

  it("telt units die binnen de grens verlopen", async () => {
    expect(await aantalVerlooptBinnen(admin, "2036-12-31", db)).toBe(1);
    expect(await aantalVerlooptBinnen(admin, "2030-01-01", db)).toBe(0);
  });

  it("weigert de telling van een klant", async () => {
    await expect(
      aantalVerlooptBinnen(klant, "2036-12-31", db),
    ).rejects.toThrow(GeenToegangError);
  });
});

describe("schema-integriteit", () => {
  it("laat geen dubbel lotnummer toe", async () => {
    await expect(
      db.insert(lots).values({
        lotNummer: "LOT-2026-A",
        productId: id.product,
        productiedatum: "2026-06-01",
        aantal: 10,
      }),
    ).rejects.toThrow();
  });

  it("laat geen unit met een onbekend lot toe", async () => {
    await expect(
      db.insert(registeredUnits).values({
        lotId: "99999999-9999-4999-8999-999999999999",
        installatiedatum: "2026-02-01",
        vervaldatum: "2036-02-01",
      }),
    ).rejects.toThrow();
  });

  it("laat geen tweede account op hetzelfde e-mailadres toe", async () => {
    await expect(
      db.insert(users).values({ email: "anna@example.nl" }),
    ).rejects.toThrow();
  });
});
