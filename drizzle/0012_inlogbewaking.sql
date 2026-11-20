CREATE TABLE "inlogpogingen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"email" text,
	"soort" text NOT NULL,
	"gelukt" boolean NOT NULL,
	"tijd" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_blokkades" (
	"ip" text PRIMARY KEY NOT NULL,
	"reden" text NOT NULL,
	"tot" timestamp with time zone NOT NULL,
	"keer" integer DEFAULT 1 NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "inlogpogingen_ip_tijd" ON "inlogpogingen" USING btree ("ip","tijd");--> statement-breakpoint
CREATE INDEX "inlogpogingen_email_tijd" ON "inlogpogingen" USING btree ("email","tijd");