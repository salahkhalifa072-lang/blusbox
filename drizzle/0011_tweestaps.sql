CREATE TABLE "tweestaps" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"geheim_versleuteld" text NOT NULL,
	"actief_op" timestamp with time zone,
	"laatste_stap" integer DEFAULT -1 NOT NULL,
	"herstelcodes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mislukt" integer DEFAULT 0 NOT NULL,
	"geblokkeerd_tot" timestamp with time zone,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tweestaps" ADD CONSTRAINT "tweestaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;