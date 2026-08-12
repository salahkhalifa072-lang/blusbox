import { and, eq, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  lots,
  orderLines,
  orders,
  recallNotices,
  registeredUnits,
  users,
  type Rol,
} from "./schema";
import { magDashboard, unitScope, vereis } from "@/lib/rollen";
import { plusMaanden, type IsoDatum } from "@/lib/levensduur";

export type Actor = { id: string; rol: Rol };

/**
 * Every query takes the handle as its last argument, defaulting to the
 * app's connection. That lets the integration tests run the real queries
 * against a throwaway database instead of asserting on mocks.
 *
 * The default is resolved lazily inside each function rather than imported
 * at module load, so importing this module never requires DATABASE_URL —
 * the tests pass their own handle and never touch the app connection.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = Pick<PostgresJsDatabase<any>, "select">;

async function appDb(): Promise<Db> {
  const { db } = await import("./index");
  return db as unknown as Db;
}

/**
 * §9.2 / §15: from a lot number to the list of customers who hold units
 * from it. This is the query the dashboard exists for, so it lives here
 * rather than being assembled ad hoc in a route.
 *
 * Two paths are unioned because a unit can be known in two ways:
 *  - registered: the customer told us where it is installed
 *  - shipped only: we know which order line carried the lot
 * A recall must reach both, including guests who never made an account.
 */
export async function afnemersVanLot(
  actor: Actor,
  lotNummer: string,
  db?: Db,
) {
  vereis(magDashboard(actor.rol), "afnemerslijst van een lot opvragen");
  const d = db ?? (await appDb());

  const [lot] = await d
    .select({ id: lots.id })
    .from(lots)
    .where(eq(lots.lotNummer, lotNummer))
    .limit(1);

  if (!lot) return [];

  const viaRegistratie = d
    .select({
      email: sql<string>`coalesce(${users.email}, ${orders.gastEmail})`.as(
        "email",
      ),
      naam: users.name,
      userId: registeredUnits.userId,
      ordernummer: orders.ordernummer,
      unitId: sql<string | null>`${registeredUnits.id}`.as("unit_id"),
      installatiedatum: sql<string | null>`${registeredUnits.installatiedatum}`.as(
        "installatiedatum",
      ),
      postcode: registeredUnits.postcode,
    })
    .from(registeredUnits)
    .leftJoin(users, eq(users.id, registeredUnits.userId))
    .leftJoin(orderLines, eq(orderLines.id, registeredUnits.orderLineId))
    .leftJoin(orders, eq(orders.id, orderLines.orderId))
    .where(eq(registeredUnits.lotId, lot.id));

  const viaBestelling = d
    .select({
      email: sql<string>`coalesce(${users.email}, ${orders.gastEmail})`.as(
        "email",
      ),
      naam: users.name,
      userId: orders.userId,
      ordernummer: orders.ordernummer,
      unitId: sql<string | null>`null`.as("unit_id"),
      installatiedatum: sql<string | null>`null`.as("installatiedatum"),
      postcode: orders.postcode,
    })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orderLines.lotId, lot.id));

  return viaRegistratie.union(viaBestelling);
}

/**
 * The list to actually mail for a recall.
 *
 * `afnemersVanLot` returns one row per piece of evidence, so a customer who
 * both ordered and registered appears twice — useful in the dashboard,
 * wrong for sending. This collapses to one entry per e-mail address and
 * keeps the richest row (the one that knows where the unit is installed),
 * so the notice can say "de unit op postcode 1011AB".
 */
export async function recallOntvangers(
  actor: Actor,
  lotNummer: string,
  db?: Db,
) {
  const rijen = await afnemersVanLot(actor, lotNummer, db);

  const perEmail = new Map<string, (typeof rijen)[number]>();
  for (const rij of rijen) {
    if (!rij.email) continue;
    const bestaand = perEmail.get(rij.email);
    // prefer the row that carries installation details
    if (!bestaand || (bestaand.unitId === null && rij.unitId !== null)) {
      perEmail.set(rij.email, rij);
    }
  }
  return [...perEmail.values()];
}

/**
 * §9.3 reminder scheduler: units with a reminder due on `vandaag`.
 *
 * Takes today's date and derives the horizons itself. An earlier version
 * asked the caller for three pre-computed boundary dates, which is easy to
 * get backwards — the horizon for the twelve-month reminder is today plus
 * twelve months, not the reminder date itself.
 */
export async function unitsMetVerlopenHerinnering(
  actor: Actor,
  vandaag: IsoDatum,
  db?: Db,
) {
  vereis(magDashboard(actor.rol), "herinneringen inplannen");
  const d = db ?? (await appDb());

  // A reminder is due once vervaldatum - N months has passed, i.e. once
  // vervaldatum falls within N months of today.
  const horizon = {
    twaalf: plusMaanden(vandaag, 12),
    zes: plusMaanden(vandaag, 6),
    een: plusMaanden(vandaag, 1),
  };

  return d
    .select()
    .from(registeredUnits)
    .where(
      or(
        and(
          lte(registeredUnits.vervaldatum, horizon.twaalf),
          sql`${registeredUnits.herinnering12Op} is null`,
        ),
        and(
          lte(registeredUnits.vervaldatum, horizon.zes),
          sql`${registeredUnits.herinnering6Op} is null`,
        ),
        and(
          lte(registeredUnits.vervaldatum, horizon.een),
          sql`${registeredUnits.herinnering1Op} is null`,
        ),
      ),
    );
}

/**
 * Units visible to the actor. The scope comes from lib/rollen, so a klant
 * physically cannot select another customer's rows — the filter is in the
 * WHERE clause, not in a template.
 */
export async function zichtbareUnits(actor: Actor, db?: Db) {
  const scope = unitScope(actor);
  const d = db ?? (await appDb());

  const basis = d.select().from(registeredUnits);

  switch (scope.soort) {
    case "alles":
      return basis;
    case "installateur":
      return basis.where(
        eq(registeredUnits.installateurId, scope.installateurId),
      );
    case "eigenaar":
      return basis.where(eq(registeredUnits.userId, scope.userId));
  }
}

/** §9.1 overview tile: units expiring within twelve months. */
export async function aantalVerlooptBinnen(
  actor: Actor,
  grensdatum: string,
  db?: Db,
) {
  vereis(magDashboard(actor.rol), "voorraad- en vervalcijfers opvragen");
  const d = db ?? (await appDb());

  const [row] = await d
    .select({ aantal: sql<number>`count(*)::int` })
    .from(registeredUnits)
    .where(
      and(
        lte(registeredUnits.vervaldatum, grensdatum),
        isNotNull(registeredUnits.installatiedatum),
      ),
    );

  return row?.aantal ?? 0;
}

/**
 * §9.2 terugroepberichten.
 *
 * Deze drie staan hier en niet in de server action, zodat ze tegen een
 * echte database getest kunnen worden. De action doet er de rolcontrole en
 * het mailen omheen; de regels over wat wanneer gestempeld mag worden zitten
 * hier.
 */

/**
 * Schrijvende variant van de handle hierboven.
 *
 * Gebaseerd op `PgDatabase` en niet op `PostgresJsDatabase`: postgres-js en
 * PGlite geven bij `update` een net iets ander type terug, en alleen de
 * gedeelde basis past op allebei. Anders draaien de tests wel, maar weigert
 * tsc de testhandle.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchrijfDb = Pick<PgDatabase<any, any, any>, "select" | "update">;

async function appSchrijfDb(): Promise<SchrijfDb> {
  const { db } = await import("./index");
  return db as unknown as SchrijfDb;
}

/** Berichten die nog verstuurd moeten worden. Twee keer drukken is veilig. */
export async function openstaandeNotices(recallId: string, db?: Db) {
  const handle = db ?? (await appDb());
  return handle
    .select({ id: recallNotices.id, email: recallNotices.email })
    .from(recallNotices)
    .where(
      and(
        eq(recallNotices.recallId, recallId),
        isNull(recallNotices.verzondenOp),
      ),
    );
}

/**
 * Stempelt een bericht als verstuurd. Alleen aanroepen nadat de provider
 * het heeft aangenomen — andersom ziet een mislukte verzending eruit als
 * afgehandeld en krijgt die afnemer nooit meer bericht.
 */
export async function markeerVerzonden(noticeId: string, db?: SchrijfDb) {
  const handle = db ?? (await appSchrijfDb());
  await handle
    .update(recallNotices)
    .set({ verzondenOp: new Date() })
    .where(eq(recallNotices.id, noticeId));
}

/**
 * Registreert dat een afnemer het bericht heeft gezien.
 *
 * De eerste bevestiging telt: dat is het moment waarop iemand het gelezen
 * had, en dat moment mag niet opschuiven doordat de pagina nog eens wordt
 * geopend. Geeft terug of déze aanroep het heeft vastgelegd.
 */
export async function registreerBevestiging(
  noticeId: string,
  db?: SchrijfDb,
): Promise<boolean> {
  const handle = db ?? (await appSchrijfDb());
  const gewijzigd = await handle
    .update(recallNotices)
    .set({ bevestigdOp: new Date() })
    .where(
      and(eq(recallNotices.id, noticeId), isNull(recallNotices.bevestigdOp)),
    )
    .returning({ id: recallNotices.id });

  return gewijzigd.length > 0;
}

/**
 * §9.3 vervangingsherinneringen.
 *
 * Levert de units waarvoor vandaag een herinnering openstaat, met het adres
 * waar die heen moet. Het adres komt van het account als dat er is, en
 * anders van de bestelling — een gast heeft net zo goed een module in de
 * meterkast hangen.
 *
 * Units zonder enig e-mailadres blijven weg: die vallen niet te bereiken en
 * zouden de batch alleen maar laten struikelen. Ze blijven wel in het
 * dashboard staan als "verloopt binnenkort".
 */
export async function herinneringsOntvangers(
  actor: Actor,
  vandaag: IsoDatum,
  db?: Db,
) {
  vereis(magDashboard(actor.rol), "herinneringen versturen");
  const d = db ?? (await appDb());

  const horizon = plusMaanden(vandaag, 12);

  const rijen = await d
    .select({
      unitId: registeredUnits.id,
      email: sql<
        string | null
      >`coalesce(${users.email}, ${orders.gastEmail})`.as("email"),
      naam: users.name,
      vervaldatum: registeredUnits.vervaldatum,
      installatiedatum: registeredUnits.installatiedatum,
      lotNummer: lots.lotNummer,
      herinnering12Op: registeredUnits.herinnering12Op,
      herinnering6Op: registeredUnits.herinnering6Op,
      herinnering1Op: registeredUnits.herinnering1Op,
    })
    .from(registeredUnits)
    .innerJoin(lots, eq(lots.id, registeredUnits.lotId))
    .leftJoin(users, eq(users.id, registeredUnits.userId))
    .leftJoin(orderLines, eq(orderLines.id, registeredUnits.orderLineId))
    .leftJoin(orders, eq(orders.id, orderLines.orderId))
    // Alles wat binnen een jaar verloopt; welke herinnering precies aan de
    // beurt is bepaalt `verschuldigdeHerinnering` per rij.
    .where(lte(registeredUnits.vervaldatum, horizon));

  return rijen.filter((r): r is typeof r & { email: string } =>
    Boolean(r.email),
  );
}

/** Stempelt de verstuurde herinnering, zodat hij niet nog eens gaat. */
export async function markeerHerinnering(
  unitId: string,
  maand: 12 | 6 | 1,
  db?: SchrijfDb,
) {
  const handle = db ?? (await appSchrijfDb());
  const kolom =
    maand === 12
      ? { herinnering12Op: new Date() }
      : maand === 6
        ? { herinnering6Op: new Date() }
        : { herinnering1Op: new Date() };

  await handle
    .update(registeredUnits)
    .set(kolom)
    .where(eq(registeredUnits.id, unitId));
}

/**
 * Het e-mailadres waarop de klant van een bestelling bereikbaar is.
 *
 * `gastEmail` staat alleen gevuld bij een gastbestelling — bij een account
 * blijft het bewust leeg en hangt het adres aan de gebruiker. Wie alleen
 * `gastEmail` leest stuurt dus niets naar ingelogde klanten. De
 * bestelbevestiging ontsnapte daaraan omdat Stripe het adres meegeeft; alles
 * wat later vanuit het dashboard vertrekt heeft die bron niet.
 */
export async function contactadresVanBestelling(
  ordernummer: string,
  db?: Db,
): Promise<string | null> {
  const handle = db ?? (await appDb());

  const [rij] = await handle
    .select({
      gastEmail: orders.gastEmail,
      accountEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.ordernummer, ordernummer))
    .limit(1);

  if (!rij) return null;
  return rij.accountEmail ?? rij.gastEmail ?? null;
}
