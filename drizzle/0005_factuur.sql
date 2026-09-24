ALTER TABLE "orders" ADD COLUMN "balieverkoop" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bedrijfsnaam" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "factuurnummer" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gefactureerd_op" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "betaaltoken" text;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_factuurnummer_uniek" ON "orders" USING btree ("factuurnummer");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_betaaltoken_uniek" ON "orders" USING btree ("betaaltoken");