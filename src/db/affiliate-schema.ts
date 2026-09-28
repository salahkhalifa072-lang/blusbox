import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { orders, users } from "./schema";

/**
 * Affiliateprogramma.
 *
 * Twee conventies uit het hoofdschema gelden hier onverkort: geld staat in
 * hele eurocenten, nooit als float, en tijdstempels dragen een tijdzone.
 * Percentages staan in basispunten (2000 = 20,00%) om dezelfde reden:
 * 20,5% als kommagetal opslaan levert vroeg of laat een commissie op die
 * een cent afwijkt van wat er op het scherm stond.
 *
 * Er is bewust géén aparte `affiliate_applications`-tabel. Een aanvraag en
 * een affiliate zijn hetzelfde ding in een andere toestand; ze uit elkaar
 * trekken betekent dezelfde gegevens op twee plekken bijhouden en bij
 * goedkeuring overpompen. Dat gaat een keer mis. De aanvraaggegevens staan
 * hier op de affiliate zelf, met `status` als toestand.
 */

export const affiliateStatusEnum = pgEnum("affiliate_status", [
  "aangevraagd",
  "goedgekeurd",
  "afgewezen",
  "geschorst",
]);

export const commissieStatusEnum = pgEnum("commissie_status", [
  /** Verkoop geregistreerd, bedenktijd loopt nog. */
  "open",
  /** Bedenktijd voorbij, klaar om uit te betalen. */
  "goedgekeurd",
  /** Zit in een uitbetaling die als betaald is gemarkeerd. */
  "uitbetaald",
  /** Retour, annulering of terugboeking: vervalt geheel of deels. */
  "teruggedraaid",
  /** Door een beheerder tegengehouden, bijvoorbeeld bij fraudeverdenking. */
  "geblokkeerd",
]);

export const uitbetalingStatusEnum = pgEnum("uitbetaling_status", [
  "concept",
  "uitbetaald",
  "mislukt",
]);

/* ---------------------------------------------------------- affiliates */

export const affiliates = pgTable(
  "affiliates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * Elke affiliate is ook een gewone gebruiker: inloggen, wachtwoord en
     * sessie lopen via het bestaande auth-systeem. Eén affiliate per
     * gebruiker, vandaar de unieke sleutel.
     */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Het stukje na /r/ in de persoonlijke link. */
    slug: text("slug").notNull(),

    status: affiliateStatusEnum("status").notNull().default("aangevraagd"),

    /**
     * Afwijkend percentage in basispunten. Null betekent: gebruik het
     * standaardpercentage uit affiliate_settings. Bewust nullable en niet
     * gevuld met de standaard, anders verandert een nieuw standaardtarief
     * niets meer voor bestaande affiliates.
     */
    percentageBp: integer("percentage_bp"),

    // Aanvraaggegevens
    bedrijfsnaam: text("bedrijfsnaam"),
    website: text("website"),
    kanalen: text("kanalen"),
    promotiemethode: text("promotiemethode"),
    landcode: text("landcode").notNull().default("NL"),
    uitbetaalmethode: text("uitbetaalmethode"),
    /**
     * IBAN of ander rekeningnummer. Het minimum om te kunnen betalen, meer
     * niet: geen kopie identiteitsbewijs, geen adres, geen geboortedatum.
     * Wat je niet opslaat kan niet uitlekken.
     */
    uitbetaalRekening: text("uitbetaal_rekening"),
    uitbetaalTenNameVan: text("uitbetaal_ten_name_van"),

    /** Reden van afwijzing of schorsing, zichtbaar voor de beheerder. */
    beheerdersnotitie: text("beheerdersnotitie"),

    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
    beoordeeldOp: timestamp("beoordeeld_op", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("affiliates_user_uniek").on(t.userId),
    uniqueIndex("affiliates_slug_uniek").on(t.slug),
    index("affiliates_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------ voorwaardenacceptatie */

/**
 * Welke versie van de voorwaarden iemand heeft geaccepteerd, en wanneer.
 * Aparte tabel en geen veld op de affiliate: bij een nieuwe versie moet je
 * kunnen aantonen wie wát heeft geaccepteerd, en dat kan alleen als de
 * oude acceptatie blijft staan.
 */
export const affiliateVoorwaarden = pgTable(
  "affiliate_voorwaarden_acceptatie",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateId: uuid("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    versie: text("versie").notNull(),
    geaccepteerdOp: timestamp("geaccepteerd_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("affiliate_voorwaarden_affiliate_idx").on(t.affiliateId)],
);

/* --------------------------------------------------------------- links */

export const affiliateLinks = pgTable(
  "affiliate_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateId: uuid("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    /** Herkenbare naam voor in het dashboard. */
    label: text("label"),
    /**
     * Bestemming binnen de site, altijd beginnend met "/". Nooit een
     * volledige URL: dat is precies hoe een open redirect ontstaat.
     */
    doelPad: text("doel_pad").notNull().default("/"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("affiliate_links_affiliate_idx").on(t.affiliateId)],
);

/* -------------------------------------------------------------- klikken */

export const affiliateKlikken = pgTable(
  "affiliate_klikken",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateId: uuid("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    linkId: uuid("link_id").references(() => affiliateLinks.id, {
      onDelete: "set null",
    }),
    doelPad: text("doel_pad").notNull(),
    /**
     * Geen IP-adres, maar een hash ervan met een servergeheim. Genoeg om
     * te zien dat honderd klikken van dezelfde bron komen, te weinig om
     * iemand te identificeren of de hash terug te rekenen.
     */
    bronHash: text("bron_hash"),
    /** Alleen de grove soort: "mobiel", "desktop", "bot". */
    apparaat: text("apparaat"),
    verwijzer: text("verwijzer"),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("affiliate_klikken_affiliate_idx").on(t.affiliateId),
    index("affiliate_klikken_datum_idx").on(t.aangemaaktOp),
    index("affiliate_klikken_bron_idx").on(t.bronHash),
  ],
);

/* ---------------------------------------------------------- attributie */

/**
 * Welke affiliate hoort bij welke bestelling.
 *
 * Eén rij per bestelling — de unieke sleutel op order_id is wat "laatste
 * geldige verwijzing" afdwingt op databaseniveau in plaats van in code.
 * Staat los van de commissie omdat een bestelling wél toegeschreven kan
 * zijn zonder commissie op te leveren: zelfverwijzing, uitgesloten
 * product, of een bestelling die nooit betaald is.
 */
export const affiliateAttributies = pgTable(
  "affiliate_attributies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    affiliateId: uuid("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "restrict" }),
    klikId: uuid("klik_id").references(() => affiliateKlikken.id, {
      onDelete: "set null",
    }),
    /** Tijdstip van de klik die tot deze toeschrijving leidde. */
    klikOp: timestamp("klik_op", { withTimezone: true }),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("affiliate_attributies_order_uniek").on(t.orderId),
    index("affiliate_attributies_affiliate_idx").on(t.affiliateId),
  ],
);

/* ---------------------------------------------------------- commissies */

export const affiliateCommissies = pgTable(
  "affiliate_commissies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    affiliateId: uuid("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "restrict" }),

    /** Productwaarde na korting, exclusief btw en verzendkosten. */
    grondslagCenten: integer("grondslag_centen").notNull(),
    percentageBp: integer("percentage_bp").notNull(),
    bedragCenten: integer("bedrag_centen").notNull(),

    status: commissieStatusEnum("status").notNull().default("open"),

    /**
     * Wanneer deze commissie op zijn vroegst goedgekeurd mag worden: het
     * einde van de bedenktijd. Leeg zolang de bestelling niet geleverd is,
     * want die termijn begint pas bij ontvangst.
     */
    rijpOp: timestamp("rijp_op", { withTimezone: true }),
    goedgekeurdOp: timestamp("goedgekeurd_op", { withTimezone: true }),

    uitbetalingId: uuid("uitbetaling_id"),

    /** Verplicht bij terugdraaien of blokkeren. */
    reden: text("reden"),

    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
    bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    /*
     * De kern van het hele systeem: één commissie per bestelling, door de
     * database afgedwongen. Een webhook die tweemaal binnenkomt, een
     * herstart midden in de verwerking of twee gelijktijdige verzoeken
     * kunnen hier geen tweede rij naast zetten. Controle in code alleen is
     * niet genoeg — die verliest van een race.
     */
    uniqueIndex("affiliate_commissies_order_uniek").on(t.orderId),
    index("affiliate_commissies_affiliate_idx").on(t.affiliateId),
    index("affiliate_commissies_status_idx").on(t.status),
  ],
);

/* -------------------------------------------------------- uitbetalingen */

export const affiliateUitbetalingen = pgTable(
  "affiliate_uitbetalingen",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateId: uuid("affiliate_id")
      .notNull()
      .references(() => affiliates.id, { onDelete: "restrict" }),
    bedragCenten: integer("bedrag_centen").notNull(),
    status: uitbetalingStatusEnum("status").notNull().default("concept"),
    /** Bankreferentie of betaalkenmerk, ingevuld bij het afboeken. */
    referentie: text("referentie"),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
    uitbetaaldOp: timestamp("uitbetaald_op", { withTimezone: true }),
  },
  (t) => [
    index("affiliate_uitbetalingen_affiliate_idx").on(t.affiliateId),
    index("affiliate_uitbetalingen_status_idx").on(t.status),
  ],
);

export const affiliateUitbetalingRegels = pgTable(
  "affiliate_uitbetaling_regels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    uitbetalingId: uuid("uitbetaling_id")
      .notNull()
      .references(() => affiliateUitbetalingen.id, { onDelete: "cascade" }),
    commissieId: uuid("commissie_id")
      .notNull()
      .references(() => affiliateCommissies.id, { onDelete: "restrict" }),
    bedragCenten: integer("bedrag_centen").notNull(),
  },
  (t) => [
    /* Dezelfde commissie kan nooit in twee uitbetalingen belanden. */
    uniqueIndex("affiliate_uitbetaling_regels_commissie_uniek").on(
      t.commissieId,
    ),
    index("affiliate_uitbetaling_regels_uitbetaling_idx").on(t.uitbetalingId),
  ],
);

/* ------------------------------------------------------------ auditlog */

export const affiliateAuditlog = pgTable(
  "affiliate_auditlog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Wie de handeling deed. Null bij een geautomatiseerde stap. */
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    affiliateId: uuid("affiliate_id").references(() => affiliates.id, {
      onDelete: "set null",
    }),
    commissieId: uuid("commissie_id").references(() => affiliateCommissies.id, {
      onDelete: "set null",
    }),
    actie: text("actie").notNull(),
    reden: text("reden"),
    /** Korte samenvatting van wat er veranderde, als leesbare tekst. */
    details: text("details"),
    aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("affiliate_auditlog_affiliate_idx").on(t.affiliateId),
    index("affiliate_auditlog_datum_idx").on(t.aangemaaktOp),
  ],
);

/* --------------------------------------------------------- instellingen */

/**
 * Eén rij met de programmabrede instellingen.
 *
 * Een tabel en geen omgevingsvariabelen, omdat een beheerder dit moet
 * kunnen wijzigen zonder deploy. De rij wordt aangemaakt met de standaarden
 * uit de opdracht: 20%, 30 dagen, drempel € 50, maandelijks.
 */
export const affiliateInstellingen = pgTable("affiliate_instellingen", {
  id: uuid("id").primaryKey().defaultRandom(),
  standaardPercentageBp: integer("standaard_percentage_bp")
    .notNull()
    .default(2000),
  attributieDagen: integer("attributie_dagen").notNull().default(30),
  uitbetalingsdrempelCenten: integer("uitbetalingsdrempel_centen")
    .notNull()
    .default(5000),
  /** "maandelijks" of "handmatig". */
  uitbetalingsfrequentie: text("uitbetalingsfrequentie")
    .notNull()
    .default("maandelijks"),
  programmaActief: boolean("programma_actief").notNull().default(true),
  voorwaardenVersie: text("voorwaarden_versie").notNull().default("2026-09-28"),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------- webhook-idempotentie */

/**
 * Elk verwerkt Stripe-event, op id.
 *
 * Stripe levert bij twijfel opnieuw af, en dat is precies goed — maar dan
 * moet de tweede keer niets meer doen. De unieke sleutel hieronder is de
 * grendel: het invoegen mislukt bij een herhaling, en dat is het signaal
 * om te stoppen.
 */
export const verwerkteWebhooks = pgTable(
  "verwerkte_webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    verwerktOp: timestamp("verwerkt_op", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("verwerkte_webhooks_event_uniek").on(t.eventId)],
);

/*
 * Producten kunnen van commissie worden uitgesloten. Dat veld hoort bij
 * het product zelf en staat daarom in schema.ts — zie
 * products.commissieUitgesloten.
 */
