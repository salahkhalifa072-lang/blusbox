-- Eenmalige tokens voor het opnieuw instellen van een vergeten wachtwoord.
--
-- Idempotent, net als 0006 en 0007: deze migratie draait mee in
-- `vercel-build` en komt dus langs op een lege database, op productie en
-- op elke preview-branch.

CREATE TABLE IF NOT EXISTS "wachtwoord_herstel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"verloopt_op" timestamp with time zone NOT NULL,
	"gebruikt_op" timestamp with time zone,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "wachtwoord_herstel" ADD CONSTRAINT "wachtwoord_herstel_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
-- Opzoeken gebeurt altijd op de hash; dat is de enige ingang.
CREATE UNIQUE INDEX IF NOT EXISTS "wachtwoord_herstel_token_uniek" ON "wachtwoord_herstel" USING btree ("token_hash");
--> statement-breakpoint
-- Voor de telling "hoeveel aanvragen deed dit account het afgelopen uur".
CREATE INDEX IF NOT EXISTS "wachtwoord_herstel_user_idx" ON "wachtwoord_herstel" USING btree ("user_id","aangemaakt_op");
