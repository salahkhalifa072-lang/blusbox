ALTER TYPE "public"."rol" ADD VALUE 'verkoper';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "verkoper_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_verkoper_id_users_id_fk" FOREIGN KEY ("verkoper_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;