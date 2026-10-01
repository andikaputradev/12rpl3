CREATE TYPE "public"."gender" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TABLE "academic_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"description" text,
	"is_featured_countdown" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beranda_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"link_href" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"motto" text NOT NULL,
	"sejarah" text NOT NULL,
	"visi" text NOT NULL,
	"misi" jsonb NOT NULL,
	"tahun_ajaran" text NOT NULL,
	"foto_kelas_url" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_count" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "display_order" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "public_contact" text;--> statement-breakpoint
ALTER TABLE "academic_events" ADD CONSTRAINT "academic_events_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beranda_highlights" ADD CONSTRAINT "beranda_highlights_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_profile" ADD CONSTRAINT "class_profile_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academic_events_date_idx" ON "academic_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "academic_events_featured_idx" ON "academic_events" USING btree ("is_featured_countdown");--> statement-breakpoint
CREATE INDEX "beranda_highlights_active_order_idx" ON "beranda_highlights" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "profiles_display_order_idx" ON "profiles" USING btree ("display_order");