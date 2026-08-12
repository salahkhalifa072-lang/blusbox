import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { maakTestDb } from "./testdb";
import {
  markeerVerzonden,
  openstaandeNotices,
  registreerBevestiging,
} from "./queries";
import { lots, products, recallNotices, recalls } from "./schema";

/**
 * §9.2 versturen en bevestigen van terugroepberichten, tegen een echte
 * Postgres-engine.
 *
 * Wat hier bewaakt wordt is niet zozeer de SQL als wel de volgorde: een
 * bericht mag pas als verstuurd gelden als het écht weg is, en een
 * bevestiging mag niet opschuiven. Bij een terugroepactie is het verschil
 * tussen "gewaarschuwd" en "denkt gewaarschuwd te zijn" de hele zaak.
 */

type Db = Awaited<ReturnType<typeof maakTestDb>>["db"];

let db: Db;

const id = {
  product: "11111111-1111-4111-8111-111111111111",
  lot: "22222222-2222-4222-8222-222222222222",
  recall: "77777777-7777-4777-8777-111111111111",
  noticeA: "88888888-8888-4888-8888-111111111111",
  noticeB: "88888888-8888-4888-8888-222222222222",
  noticeC: "88888888-8888-4888-8888-333333333333",
};

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
    lotNummer: "LOT-2026-A",
    productId: id.product,
    productiedatum: "2026-01-15",
    aantal: 500,
  });

  await db.insert(recalls).values({
    id: id.recall,
    lotId: id.lot,
    reden: "Activeringstemperatuur buiten de marge bij een steekproef.",
  });

  await db.insert(recallNotices).values([
    { id: id.noticeA, recallId: id.recall, email: "anna@example.nl" },
    { id: id.noticeB, recallId: id.recall, email: "bram@example.nl" },
    { id: id.noticeC, recallId: id.recall, email: "gast@example.nl" },
  ]);
});

describe("openstaande berichten", () => {
  it("geeft alles terug zolang er niets verstuurd is", async () => {
    const open = await openstaandeNotices(id.recall, db);
    expect(open).toHaveLength(3);
    expect(open.map((o) => o.email).sort()).toEqual([
      "anna@example.nl",
      "bram@example.nl",
      "gast@example.nl",
    ]);
  });

  it("laat verstuurde berichten weg, zodat niemand het dubbel krijgt", async () => {
    await markeerVerzonden(id.noticeA, db);

    const open = await openstaandeNotices(id.recall, db);
    expect(open).toHaveLength(2);
    expect(open.map((o) => o.email)).not.toContain("anna@example.nl");
  });

  it("is leeg als alles weg is", async () => {
    for (const n of [id.noticeA, id.noticeB, id.noticeC]) {
      await markeerVerzonden(n, db);
    }
    expect(await openstaandeNotices(id.recall, db)).toHaveLength(0);
  });

  it("houdt recalls uit elkaar", async () => {
    const tweede = "77777777-7777-4777-8777-222222222222";
    await db.insert(recalls).values({
      id: tweede,
      lotId: id.lot,
      reden: "Tweede actie op hetzelfde lot.",
    });
    await db.insert(recallNotices).values({
      id: "88888888-8888-4888-8888-444444444444",
      recallId: tweede,
      email: "anna@example.nl",
    });

    expect(await openstaandeNotices(id.recall, db)).toHaveLength(3);
    expect(await openstaandeNotices(tweede, db)).toHaveLength(1);
  });
});

describe("bevestiging", () => {
  it("legt de bevestiging vast", async () => {
    expect(await registreerBevestiging(id.noticeA, db)).toBe(true);

    const [rij] = await db
      .select({ bevestigdOp: recallNotices.bevestigdOp })
      .from(recallNotices)
      .where(eqId(id.noticeA));
    expect(rij.bevestigdOp).toBeInstanceOf(Date);
  });

  it("laat de eerste bevestiging staan bij een tweede klik", async () => {
    await registreerBevestiging(id.noticeA, db);
    const [eerste] = await db
      .select({ bevestigdOp: recallNotices.bevestigdOp })
      .from(recallNotices)
      .where(eqId(id.noticeA));

    // Tweede poging meldt dat er niets veranderd is en laat het moment staan:
    // dát is wanneer de afnemer het gelezen had.
    expect(await registreerBevestiging(id.noticeA, db)).toBe(false);

    const [tweede] = await db
      .select({ bevestigdOp: recallNotices.bevestigdOp })
      .from(recallNotices)
      .where(eqId(id.noticeA));
    expect(tweede.bevestigdOp?.getTime()).toBe(eerste.bevestigdOp?.getTime());
  });

  it("raakt de andere afnemers niet", async () => {
    await registreerBevestiging(id.noticeA, db);

    const rijen = await db
      .select({
        id: recallNotices.id,
        bevestigdOp: recallNotices.bevestigdOp,
      })
      .from(recallNotices);

    const bevestigd = rijen.filter((r) => r.bevestigdOp !== null);
    expect(bevestigd).toHaveLength(1);
    expect(bevestigd[0].id).toBe(id.noticeA);
  });

  it("doet niets bij een onbekende id", async () => {
    const onbekend = "99999999-9999-4999-8999-999999999999";
    expect(await registreerBevestiging(onbekend, db)).toBe(false);
  });

  it("staat los van versturen", async () => {
    // Een afnemer die telefonisch reageert mag bevestigd worden zonder dat
    // de mail ooit is aangekomen — en omgekeerd.
    await registreerBevestiging(id.noticeA, db);

    const open = await openstaandeNotices(id.recall, db);
    expect(open.map((o) => o.id)).toContain(id.noticeA);
  });
});

/** Kleine hulp zodat de tests leesbaar blijven. */
function eqId(waarde: string) {
  return eq(recallNotices.id, waarde);
}
