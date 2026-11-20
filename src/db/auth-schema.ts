import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./schema";

/**
 * Auth.js tables. Kept separate from the domain schema so §10 stays
 * readable — these exist because the adapter needs them, not because the
 * business needs them. `users` itself lives in schema.ts, since role and
 * aanspreekvorm are domain concerns.
 */

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

/** Magic-link tokens (§3: Auth.js magic link + credentials). */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/** Credentials login stores its hash here, never on `users`. */
export const credentials = pgTable("credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  wachtwoordHash: text("wachtwoord_hash").notNull(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Tweestapsverificatie met een authenticator-app.
 *
 * Een rij zonder `actiefOp` is een koppeling die gestart maar nog niet met
 * een code bevestigd is; die telt bij het inloggen niet mee. Het geheim
 * staat versleuteld (zie lib/totp.ts), herstelcodes alleen als hash.
 */
export const tweestaps = pgTable("tweestaps", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  geheimVersleuteld: text("geheim_versleuteld").notNull(),
  actiefOp: timestamp("actief_op", { withTimezone: true }),
  /** Stap van de laatst gebruikte code; dezelfde code werkt geen tweede keer. */
  laatsteStap: integer("laatste_stap").notNull().default(-1),
  /** SHA-256 van de nog niet gebruikte herstelcodes. */
  herstelcodes: jsonb("herstelcodes").$type<string[]>().notNull().default([]),
  /** Foute codes op rij; bij vijf gaat het account een kwartier op slot. */
  mislukt: integer("mislukt").notNull().default(0),
  geblokkeerdTot: timestamp("geblokkeerd_tot", { withTimezone: true }),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Elke inlogpoging, geslaagd of niet: de grondstof voor het herkennen van
 * aanvallen (zie lib/inlogbewaking.ts). Na 30 dagen opgeruimd door de
 * dagelijkse cron; een IP-adres is een persoonsgegeven.
 */
export const inlogpogingen = pgTable(
  "inlogpogingen",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** IPv4 voluit, IPv6 ingekort tot het /64-blok (zie normaliseerIp). */
    ip: text("ip").notNull(),
    /** Ingevuld e-mailadres, kleine letters; ook als er geen account bij hoort. */
    email: text("email"),
    /** wachtwoord | code | herstel */
    soort: text("soort").notNull(),
    gelukt: boolean("gelukt").notNull(),
    tijd: timestamp("tijd", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inlogpogingen_ip_tijd").on(t.ip, t.tijd),
    index("inlogpogingen_email_tijd").on(t.email, t.tijd),
  ],
);

/** Geblokkeerde IP-adressen (of IPv6-blokken). */
export const ipBlokkades = pgTable("ip_blokkades", {
  ip: text("ip").primaryKey(),
  reden: text("reden").notNull(),
  tot: timestamp("tot", { withTimezone: true }).notNull(),
  /** Hoe vaak dit adres al geblokkeerd is geweest; bepaalt de duur. */
  keer: integer("keer").notNull().default(1),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
