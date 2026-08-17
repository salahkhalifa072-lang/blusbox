import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * §10 data model. Two conventions applied throughout:
 *
 * 1. Money is stored as integer eurocents, never float or numeric — the
 *    same unit lib/pricing.ts uses, so nothing is converted in between.
 * 2. Anything that must survive a product recall (lot, order line,
 *    registered unit) is linked by a real foreign key with an index, so
 *    "which customers hold units from lot X" is one indexed join (§9.2).
 */

/* ---------------------------------------------------------------- enums */

/** §9.7 — enforced at the data layer, not only in the UI. */
export const rolEnum = pgEnum("rol", [
  "admin",
  "operations",
  "installateur",
  "klant",
]);

/** §2 — je/u is a token on the account, never duplicated copy. */
export const aanspreekvormEnum = pgEnum("aanspreekvorm", ["je", "u"]);

export const orderStatusEnum = pgEnum("order_status", [
  "nieuw",
  "betaald",
  "in_behandeling",
  "verzonden",
  "geleverd",
  "geannuleerd",
  "terugbetaald",
]);

export const retourStatusEnum = pgEnum("retour_status", [
  "aangemeld",
  "goedgekeurd",
  "ontvangen",
  "terugbetaald",
  "afgewezen",
]);

/** §9.4 — the activation log is the field data nobody else in this niche has. */
export const locatieTypeEnum = pgEnum("locatie_type", [
  "woning",
  "appartement",
  "bedrijfspand",
  "vve_algemene_ruimte",
  "technische_ruimte",
  "anders",
]);

/* ---------------------------------------------------------------- users */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // name/image/emailVerified are named in English because the Auth.js
    // adapter addresses them by those exact keys. Domain columns below
    // keep the Dutch naming used everywhere else.
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    name: text("name"),
    image: text("image"),
    rol: rolEnum("rol").notNull().default("klant"),

    // Business accounts (§8): drives excl.-btw pricing and reverse charge
    bedrijfsnaam: text("bedrijfsnaam"),
    kvk: text("kvk"),
    btwId: text("btw_id"),
    /** VIES check result; null = never validated */
    btwIdGevalideerdOp: timestamp("btw_id_gevalideerd_op", {
      withTimezone: true,
    }),

    aanspreekvorm: aanspreekvormEnum("aanspreekvorm").notNull().default("je"),

    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uniek").on(t.email)],
);

/* ------------------------------------------------------------- products */

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    naam: text("naam").notNull(),
    omschrijving: text("omschrijving"),

    /** Eurocents, excl. btw. Consumer price is derived, never stored twice. */
    prijsExclBtwCenten: integer("prijs_excl_btw_centen").notNull(),
    /** 0.21 stored as 21 to keep it an integer percentage */
    btwPercentage: integer("btw_percentage").notNull().default(21),

    /**
     * Vrije voorraad. Het afrekenen mag niet meer verkopen dan er ligt;
     * een backorder op een veiligheidsproduct is een belofte die je niet
     * waar kunt maken.
     */
    voorraad: integer("voorraad").notNull().default(0),

    actief: boolean("actief").notNull().default(true),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("products_slug_uniek").on(t.slug)],
);

/* ----------------------------------------------------------------- lots */

/** §9.2 the core: every unit is traceable to a production batch. */
export const lots = pgTable(
  "lots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lotNummer: text("lot_nummer").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productiedatum: date("productiedatum").notNull(),
    aantal: integer("aantal").notNull(),
    leverancier: text("leverancier"),
    testrapportRef: text("testrapport_ref"),
    docRef: text("doc_ref"),
    /** [{ naam, url, geuploadOp }] — versioned document library (§9.5) */
    documenten: jsonb("documenten").$type<LotDocument[]>().default([]),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("lots_lotnummer_uniek").on(t.lotNummer),
    index("lots_product_idx").on(t.productId),
  ],
);

export type LotDocument = {
  naam: string;
  url: string;
  geuploadOp: string;
};

/* --------------------------------------------------------------- orders */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-facing order number, e.g. BB-2026-000123 */
    ordernummer: text("ordernummer").notNull(),

    /** Guest checkout is the default (§8): userId may be null. */
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    gastEmail: text("gast_email"),

    status: orderStatusEnum("status").notNull().default("nieuw"),

    // Totals frozen at order time — prices may change later
    subtotaalExclBtwCenten: integer("subtotaal_excl_btw_centen").notNull(),
    btwBedragCenten: integer("btw_bedrag_centen").notNull(),
    verzendkostenCenten: integer("verzendkosten_centen").notNull().default(0),
    totaalInclBtwCenten: integer("totaal_incl_btw_centen").notNull(),
    /** True when btw is reverse-charged to an EU business buyer */
    btwVerlegd: boolean("btw_verlegd").notNull().default(false),

    mollieId: text("mollie_id"),
    verzendregelToegepast: text("verzendregel_toegepast"),

    // Delivery address
    landcode: text("landcode").notNull().default("NL"),
    postcode: text("postcode"),
    huisnummer: text("huisnummer"),
    straat: text("straat"),
    plaats: text("plaats"),

    geplaatstOp: timestamp("geplaatst_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verzondenOp: timestamp("verzonden_op", { withTimezone: true }),
    /**
     * De herroepingstermijn van veertien dagen loopt vanaf ontvangst, niet
     * vanaf de bestelling. Dit veld bepaalt dus wanneer die termijn afloopt.
     */
    geleverdOp: timestamp("geleverd_op", { withTimezone: true }),
    /** Zendingnummer van de vervoerder, gaat mee in de verzendmail */
    trackAndTrace: text("track_and_trace"),
  },
  (t) => [
    uniqueIndex("orders_ordernummer_uniek").on(t.ordernummer),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_gast_email_idx").on(t.gastEmail),
  ],
);

export const orderLines = pgTable(
  "order_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    /** Assigned at fulfilment by scan or by hand (§9.2) */
    lotId: uuid("lot_id").references(() => lots.id, { onDelete: "restrict" }),
    aantal: integer("aantal").notNull(),
    stukprijsExclBtwCenten: integer("stukprijs_excl_btw_centen").notNull(),
    btwBedragCenten: integer("btw_bedrag_centen").notNull(),
  },
  (t) => [
    index("order_lines_order_idx").on(t.orderId),
    // the recall path: lot -> order lines -> orders -> customers
    index("order_lines_lot_idx").on(t.lotId),
  ],
);

/* ------------------------------------------------------- registeredUnits */

/** §9.3 end-of-life register — the entire repeat-purchase model. */
export const registeredUnits = pgTable(
  "registered_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderLineId: uuid("order_line_id").references(() => orderLines.id, {
      onDelete: "set null",
    }),
    serienummer: text("serienummer"),
    lotId: uuid("lot_id")
      .notNull()
      .references(() => lots.id, { onDelete: "restrict" }),

    /** Who holds it now — set for account holders, null for guests */
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** The installer who placed it, for the dealer register (§9.6) */
    installateurId: uuid("installateur_id").references(() => users.id, {
      onDelete: "set null",
    }),

    installatiedatum: date("installatiedatum").notNull(),
    /** installatiedatum + 10 jaar, stored so reminder queries stay cheap */
    vervaldatum: date("vervaldatum").notNull(),
    locatieType: locatieTypeEnum("locatie_type").notNull().default("woning"),
    postcode: text("postcode"),

    /** Set once the 12/6/1-month reminders have gone out */
    herinnering12Op: timestamp("herinnering_12_op", { withTimezone: true }),
    herinnering6Op: timestamp("herinnering_6_op", { withTimezone: true }),
    herinnering1Op: timestamp("herinnering_1_op", { withTimezone: true }),

    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("registered_units_lot_idx").on(t.lotId),
    index("registered_units_user_idx").on(t.userId),
    index("registered_units_installateur_idx").on(t.installateurId),
    // drives the expiry-reminder scheduler
    index("registered_units_vervaldatum_idx").on(t.vervaldatum),
  ],
);

/* ---------------------------------------------------------- activations */

export const activations = pgTable(
  "activations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registeredUnitId: uuid("registered_unit_id")
      .notNull()
      .references(() => registeredUnits.id, { onDelete: "cascade" }),
    gebeurdOp: timestamp("gebeurd_op", { withTimezone: true }).notNull(),
    oorzaak: text("oorzaak"),
    afloop: text("afloop"),
    fotos: jsonb("fotos").$type<string[]>().default([]),
    gemeldOp: timestamp("gemeld_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("activations_unit_idx").on(t.registeredUnitId)],
);

/* -------------------------------------------------------------- recalls */

export const recalls = pgTable(
  "recalls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lotId: uuid("lot_id")
      .notNull()
      .references(() => lots.id, { onDelete: "restrict" }),
    reden: text("reden").notNull(),
    geopendOp: timestamp("geopend_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
    geslotenOp: timestamp("gesloten_op", { withTimezone: true }),
  },
  (t) => [index("recalls_lot_idx").on(t.lotId)],
);

export const recallNotices = pgTable(
  "recall_notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recallId: uuid("recall_id")
      .notNull()
      .references(() => recalls.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Guests get notified too — they bought a safety product */
    email: text("email").notNull(),
    verzondenOp: timestamp("verzonden_op", { withTimezone: true }),
    bevestigdOp: timestamp("bevestigd_op", { withTimezone: true }),
  },
  (t) => [
    index("recall_notices_recall_idx").on(t.recallId),
    index("recall_notices_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------- returns */

export const returns = pgTable(
  "returns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    reden: text("reden"),
    aangevraagdOp: timestamp("aangevraagd_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Frozen at request time: whether it fell inside the 14-day window */
    binnenHerroepingstermijn: boolean("binnen_herroepingstermijn").notNull(),
    status: retourStatusEnum("status").notNull().default("aangemeld"),
    afgehandeldOp: timestamp("afgehandeld_op", { withTimezone: true }),
  },
  (t) => [index("returns_order_idx").on(t.orderId)],
);

/* -------------------------------------------------------- contentBlocks */

/** §1 — every block can carry its claim source, rendered as a footnote. */
export const contentBlocks = pgTable(
  "content_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pagina: text("pagina").notNull(),
    sleutel: text("sleutel").notNull(),
    tekstNl: text("tekst_nl").notNull(),
    bronUrl: text("bron_url"),
    bronOmschrijving: text("bron_omschrijving"),
    bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("content_blocks_pagina_sleutel").on(t.pagina, t.sleutel)],
);

/* ------------------------------------------------------------ relations */

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  units: many(registeredUnits, { relationName: "eigenaar" }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  lots: many(lots),
  orderLines: many(orderLines),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  product: one(products, {
    fields: [lots.productId],
    references: [products.id],
  }),
  orderLines: many(orderLines),
  units: many(registeredUnits),
  recalls: many(recalls),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  lines: many(orderLines),
  returns: many(returns),
}));

export const orderLinesRelations = relations(orderLines, ({ one, many }) => ({
  order: one(orders, { fields: [orderLines.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderLines.productId],
    references: [products.id],
  }),
  lot: one(lots, { fields: [orderLines.lotId], references: [lots.id] }),
  units: many(registeredUnits),
}));

export const registeredUnitsRelations = relations(
  registeredUnits,
  ({ one, many }) => ({
    orderLine: one(orderLines, {
      fields: [registeredUnits.orderLineId],
      references: [orderLines.id],
    }),
    lot: one(lots, {
      fields: [registeredUnits.lotId],
      references: [lots.id],
    }),
    eigenaar: one(users, {
      fields: [registeredUnits.userId],
      references: [users.id],
      relationName: "eigenaar",
    }),
    activations: many(activations),
  }),
);

export const activationsRelations = relations(activations, ({ one }) => ({
  unit: one(registeredUnits, {
    fields: [activations.registeredUnitId],
    references: [registeredUnits.id],
  }),
}));

export const recallsRelations = relations(recalls, ({ one, many }) => ({
  lot: one(lots, { fields: [recalls.lotId], references: [lots.id] }),
  notices: many(recallNotices),
}));

export const recallNoticesRelations = relations(recallNotices, ({ one }) => ({
  recall: one(recalls, {
    fields: [recallNotices.recallId],
    references: [recalls.id],
  }),
  user: one(users, {
    fields: [recallNotices.userId],
    references: [users.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, { fields: [returns.orderId], references: [orders.id] }),
}));

/* ---------------------------------------------------------------- types */

export type Rol = (typeof rolEnum.enumValues)[number];
export type Aanspreekvorm = (typeof aanspreekvormEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type LocatieType = (typeof locatieTypeEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Lot = typeof lots.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderLine = typeof orderLines.$inferSelect;
export type RegisteredUnit = typeof registeredUnits.$inferSelect;
