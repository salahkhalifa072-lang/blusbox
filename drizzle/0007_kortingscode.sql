ALTER TABLE "orders" ADD COLUMN "kortingscode" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "korting_centen" integer DEFAULT 0 NOT NULL;