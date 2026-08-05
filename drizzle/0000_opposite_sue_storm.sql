CREATE TYPE "public"."aanspreekvorm" AS ENUM('je', 'u');--> statement-breakpoint
CREATE TYPE "public"."locatie_type" AS ENUM('woning', 'appartement', 'bedrijfspand', 'vve_algemene_ruimte', 'technische_ruimte', 'anders');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('nieuw', 'betaald', 'in_behandeling', 'verzonden', 'geleverd', 'geannuleerd', 'terugbetaald');--> statement-breakpoint
CREATE TYPE "public"."retour_status" AS ENUM('aangemeld', 'goedgekeurd', 'ontvangen', 'terugbetaald', 'afgewezen');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'operations', 'installateur', 'klant');--> statement-breakpoint
CREATE TABLE "activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registered_unit_id" uuid NOT NULL,
	"gebeurd_op" timestamp with time zone NOT NULL,
	"oorzaak" text,
	"afloop" text,
	"fotos" jsonb DEFAULT '[]'::jsonb,
	"gemeld_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pagina" text NOT NULL,
	"sleutel" text NOT NULL,
	"tekst_nl" text NOT NULL,
	"bron_url" text,
	"bron_omschrijving" text,
	"bijgewerkt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_nummer" text NOT NULL,
	"product_id" uuid NOT NULL,
	"productiedatum" date NOT NULL,
	"aantal" integer NOT NULL,
	"leverancier" text,
	"testrapport_ref" text,
	"doc_ref" text,
	"documenten" jsonb DEFAULT '[]'::jsonb,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"lot_id" uuid,
	"aantal" integer NOT NULL,
	"stukprijs_excl_btw_centen" integer NOT NULL,
	"btw_bedrag_centen" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ordernummer" text NOT NULL,
	"user_id" uuid,
	"gast_email" text,
	"status" "order_status" DEFAULT 'nieuw' NOT NULL,
	"subtotaal_excl_btw_centen" integer NOT NULL,
	"btw_bedrag_centen" integer NOT NULL,
	"verzendkosten_centen" integer DEFAULT 0 NOT NULL,
	"totaal_incl_btw_centen" integer NOT NULL,
	"btw_verlegd" boolean DEFAULT false NOT NULL,
	"mollie_id" text,
	"verzendregel_toegepast" text,
	"landcode" text DEFAULT 'NL' NOT NULL,
	"postcode" text,
	"huisnummer" text,
	"straat" text,
	"plaats" text,
	"geplaatst_op" timestamp with time zone DEFAULT now() NOT NULL,
	"geleverd_op" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"naam" text NOT NULL,
	"omschrijving" text,
	"prijs_excl_btw_centen" integer NOT NULL,
	"btw_percentage" integer DEFAULT 21 NOT NULL,
	"gevaarlijke_goederen" boolean DEFAULT false NOT NULL,
	"un_nummer" text,
	"adr_klasse" text,
	"actief" boolean DEFAULT true NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recall_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"verzonden_op" timestamp with time zone,
	"bevestigd_op" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" uuid NOT NULL,
	"reden" text NOT NULL,
	"geopend_op" timestamp with time zone DEFAULT now() NOT NULL,
	"gesloten_op" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "registered_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_line_id" uuid,
	"serienummer" text,
	"lot_id" uuid NOT NULL,
	"user_id" uuid,
	"installateur_id" uuid,
	"installatiedatum" date NOT NULL,
	"vervaldatum" date NOT NULL,
	"locatie_type" "locatie_type" DEFAULT 'woning' NOT NULL,
	"postcode" text,
	"herinnering_12_op" timestamp with time zone,
	"herinnering_6_op" timestamp with time zone,
	"herinnering_1_op" timestamp with time zone,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"reden" text,
	"aangevraagd_op" timestamp with time zone DEFAULT now() NOT NULL,
	"binnen_herroepingstermijn" boolean NOT NULL,
	"status" "retour_status" DEFAULT 'aangemeld' NOT NULL,
	"afgehandeld_op" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"name" text,
	"image" text,
	"rol" "rol" DEFAULT 'klant' NOT NULL,
	"bedrijfsnaam" text,
	"kvk" text,
	"btw_id" text,
	"btw_id_gevalideerd_op" timestamp with time zone,
	"aanspreekvorm" "aanspreekvorm" DEFAULT 'je' NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"wachtwoord_hash" text NOT NULL,
	"bijgewerkt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "activations" ADD CONSTRAINT "activations_registered_unit_id_registered_units_id_fk" FOREIGN KEY ("registered_unit_id") REFERENCES "public"."registered_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_notices" ADD CONSTRAINT "recall_notices_recall_id_recalls_id_fk" FOREIGN KEY ("recall_id") REFERENCES "public"."recalls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_notices" ADD CONSTRAINT "recall_notices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recalls" ADD CONSTRAINT "recalls_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registered_units" ADD CONSTRAINT "registered_units_order_line_id_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_lines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registered_units" ADD CONSTRAINT "registered_units_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registered_units" ADD CONSTRAINT "registered_units_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registered_units" ADD CONSTRAINT "registered_units_installateur_id_users_id_fk" FOREIGN KEY ("installateur_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activations_unit_idx" ON "activations" USING btree ("registered_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_blocks_pagina_sleutel" ON "content_blocks" USING btree ("pagina","sleutel");--> statement-breakpoint
CREATE UNIQUE INDEX "lots_lotnummer_uniek" ON "lots" USING btree ("lot_nummer");--> statement-breakpoint
CREATE INDEX "lots_product_idx" ON "lots" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_lines_order_idx" ON "order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_lines_lot_idx" ON "order_lines" USING btree ("lot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_ordernummer_uniek" ON "orders" USING btree ("ordernummer");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_gast_email_idx" ON "orders" USING btree ("gast_email");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uniek" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "recall_notices_recall_idx" ON "recall_notices" USING btree ("recall_id");--> statement-breakpoint
CREATE INDEX "recall_notices_user_idx" ON "recall_notices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recalls_lot_idx" ON "recalls" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "registered_units_lot_idx" ON "registered_units" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "registered_units_user_idx" ON "registered_units" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "registered_units_installateur_idx" ON "registered_units" USING btree ("installateur_id");--> statement-breakpoint
CREATE INDEX "registered_units_vervaldatum_idx" ON "registered_units" USING btree ("vervaldatum");--> statement-breakpoint
CREATE INDEX "returns_order_idx" ON "returns" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uniek" ON "users" USING btree ("email");