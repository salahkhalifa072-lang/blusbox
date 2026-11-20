CREATE TABLE "contactantwoorden" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bericht_id" uuid NOT NULL,
	"onderwerp" text NOT NULL,
	"tekst" text NOT NULL,
	"verstuurd_door" text NOT NULL,
	"verstuurd_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contactberichten" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"naam" text NOT NULL,
	"email" text NOT NULL,
	"onderwerp" text NOT NULL,
	"bericht" text NOT NULL,
	"bron" text DEFAULT 'formulier' NOT NULL,
	"status" text DEFAULT 'nieuw' NOT NULL,
	"gelezen_op" timestamp with time zone,
	"ontvangen_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contactantwoorden" ADD CONSTRAINT "contactantwoorden_bericht_id_contactberichten_id_fk" FOREIGN KEY ("bericht_id") REFERENCES "public"."contactberichten"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contactberichten_status_ontvangen" ON "contactberichten" USING btree ("status","ontvangen_op");