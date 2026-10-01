-- Kortingscodes bij het afrekenen, plus twee velden op de bestelling om
-- vast te leggen wat er daadwerkelijk is verrekend.
--
-- Idempotent gemaakt, net als 0006. Deze migratie draait mee in
-- `vercel-build`, dus hij komt langs op een lege database, op productie
-- en op elke preview-branch. Eén opdracht die bij een herhaling omvalt
-- legt de hele deploy stil, en dat is hier eerder gebeurd.

CREATE TABLE IF NOT EXISTS "kortingscodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"omschrijving" text,
	"percentage_bp" integer NOT NULL,
	"actief" boolean DEFAULT true NOT NULL,
	"geldig_tot" timestamp with time zone,
	"max_gebruik" integer,
	"aantal_gebruikt" integer DEFAULT 0 NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "kortingscode" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "korting_bedrag_centen" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Twee rijen met dezelfde code zou betekenen dat het van de volgorde van
-- de query afhangt welk percentage een klant krijgt.
CREATE UNIQUE INDEX IF NOT EXISTS "kortingscodes_code_uniek" ON "kortingscodes" USING btree ("code");
--> statement-breakpoint
-- De code waarmee dit begint. DO NOTHING houdt een later in het
-- dashboard aangepast percentage overeind: een herhaalde migratie mag
-- niet terugzetten wat iemand bewust heeft gewijzigd of uitgezet.
INSERT INTO "kortingscodes" ("code", "omschrijving", "percentage_bp", "actief")
VALUES ('glasvezel20', 'Glasvezelkanaal — 20% bij het afrekenen', 2000, true)
ON CONFLICT ("code") DO NOTHING;
