ALTER TABLE "customers" ADD COLUMN "full_address" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "city" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "country" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "postal_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "order_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "cart_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "missing_fields" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "import_source" text DEFAULT '' NOT NULL;