-- Idempotent gemaakt na een gedeeltelijke handmatige toepassing op
-- productie: de tabellen, het rol-type en de indexen stonden er al, maar
-- de migratie was niet geregistreerd. Daardoor viel elke build om op
-- "type already exists" en kon er niets meer uit.
--
-- Elke opdracht slikt nu een herhaling. Dat maakt hem veilig op een lege
-- database, op de half toegepaste productie, en op elke preview-branch.

DO $$ BEGIN
  CREATE TYPE "public"."affiliate_status" AS ENUM('aangevraagd', 'goedgekeurd', 'afgewezen', 'geschorst');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."commissie_status" AS ENUM('open', 'goedgekeurd', 'uitbetaald', 'teruggedraaid', 'geblokkeerd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."uitbetaling_status" AS ENUM('concept', 'uitbetaald', 'mislukt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
ALTER TYPE "public"."rol" ADD VALUE IF NOT EXISTS 'affiliate' BEFORE 'klant';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_attributies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"klik_id" uuid,
	"klik_op" timestamp with time zone,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_auditlog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"affiliate_id" uuid,
	"commissie_id" uuid,
	"actie" text NOT NULL,
	"reden" text,
	"details" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_commissies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"grondslag_centen" integer NOT NULL,
	"percentage_bp" integer NOT NULL,
	"bedrag_centen" integer NOT NULL,
	"status" "commissie_status" DEFAULT 'open' NOT NULL,
	"rijp_op" timestamp with time zone,
	"goedgekeurd_op" timestamp with time zone,
	"uitbetaling_id" uuid,
	"reden" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL,
	"bijgewerkt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_instellingen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standaard_percentage_bp" integer DEFAULT 2000 NOT NULL,
	"attributie_dagen" integer DEFAULT 30 NOT NULL,
	"uitbetalingsdrempel_centen" integer DEFAULT 5000 NOT NULL,
	"uitbetalingsfrequentie" text DEFAULT 'maandelijks' NOT NULL,
	"programma_actief" boolean DEFAULT true NOT NULL,
	"voorwaarden_versie" text DEFAULT '2026-09-28' NOT NULL,
	"bijgewerkt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_klikken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"link_id" uuid,
	"doel_pad" text NOT NULL,
	"bron_hash" text,
	"apparaat" text,
	"verwijzer" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"label" text,
	"doel_pad" text DEFAULT '/' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_uitbetaling_regels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uitbetaling_id" uuid NOT NULL,
	"commissie_id" uuid NOT NULL,
	"bedrag_centen" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_uitbetalingen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"bedrag_centen" integer NOT NULL,
	"status" "uitbetaling_status" DEFAULT 'concept' NOT NULL,
	"referentie" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL,
	"uitbetaald_op" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_voorwaarden_acceptatie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"versie" text NOT NULL,
	"geaccepteerd_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"status" "affiliate_status" DEFAULT 'aangevraagd' NOT NULL,
	"percentage_bp" integer,
	"bedrijfsnaam" text,
	"website" text,
	"kanalen" text,
	"promotiemethode" text,
	"landcode" text DEFAULT 'NL' NOT NULL,
	"uitbetaalmethode" text,
	"uitbetaal_rekening" text,
	"uitbetaal_ten_name_van" text,
	"beheerdersnotitie" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL,
	"beoordeeld_op" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verwerkte_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"verwerkt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "commissie_uitgesloten" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_attributies" ADD CONSTRAINT "affiliate_attributies_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_attributies" ADD CONSTRAINT "affiliate_attributies_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_attributies" ADD CONSTRAINT "affiliate_attributies_klik_id_affiliate_klikken_id_fk" FOREIGN KEY ("klik_id") REFERENCES "public"."affiliate_klikken"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_auditlog" ADD CONSTRAINT "affiliate_auditlog_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_auditlog" ADD CONSTRAINT "affiliate_auditlog_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_auditlog" ADD CONSTRAINT "affiliate_auditlog_commissie_id_affiliate_commissies_id_fk" FOREIGN KEY ("commissie_id") REFERENCES "public"."affiliate_commissies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_commissies" ADD CONSTRAINT "affiliate_commissies_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_commissies" ADD CONSTRAINT "affiliate_commissies_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_klikken" ADD CONSTRAINT "affiliate_klikken_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_klikken" ADD CONSTRAINT "affiliate_klikken_link_id_affiliate_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_uitbetaling_regels" ADD CONSTRAINT "affiliate_uitbetaling_regels_uitbetaling_id_affiliate_uitbetalingen_id_fk" FOREIGN KEY ("uitbetaling_id") REFERENCES "public"."affiliate_uitbetalingen"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_uitbetaling_regels" ADD CONSTRAINT "affiliate_uitbetaling_regels_commissie_id_affiliate_commissies_id_fk" FOREIGN KEY ("commissie_id") REFERENCES "public"."affiliate_commissies"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_uitbetalingen" ADD CONSTRAINT "affiliate_uitbetalingen_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliate_voorwaarden_acceptatie" ADD CONSTRAINT "affiliate_voorwaarden_acceptatie_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_attributies_order_uniek" ON "affiliate_attributies" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_attributies_affiliate_idx" ON "affiliate_attributies" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_auditlog_affiliate_idx" ON "affiliate_auditlog" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_auditlog_datum_idx" ON "affiliate_auditlog" USING btree ("aangemaakt_op");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_commissies_order_uniek" ON "affiliate_commissies" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_commissies_affiliate_idx" ON "affiliate_commissies" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_commissies_status_idx" ON "affiliate_commissies" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_klikken_affiliate_idx" ON "affiliate_klikken" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_klikken_datum_idx" ON "affiliate_klikken" USING btree ("aangemaakt_op");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_klikken_bron_idx" ON "affiliate_klikken" USING btree ("bron_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_links_affiliate_idx" ON "affiliate_links" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_uitbetaling_regels_commissie_uniek" ON "affiliate_uitbetaling_regels" USING btree ("commissie_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_uitbetaling_regels_uitbetaling_idx" ON "affiliate_uitbetaling_regels" USING btree ("uitbetaling_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_uitbetalingen_affiliate_idx" ON "affiliate_uitbetalingen" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_uitbetalingen_status_idx" ON "affiliate_uitbetalingen" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_voorwaarden_affiliate_idx" ON "affiliate_voorwaarden_acceptatie" USING btree ("affiliate_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_user_uniek" ON "affiliates" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_slug_uniek" ON "affiliates" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliates_status_idx" ON "affiliates" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verwerkte_webhooks_event_uniek" ON "verwerkte_webhooks" USING btree ("event_id");
