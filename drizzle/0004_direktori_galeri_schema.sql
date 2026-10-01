CREATE TYPE "public"."gallery_category" AS ENUM('kegiatan_belajar', 'study_tour', 'prakerin', 'class_meeting', 'perayaan', 'lomba');--> statement-breakpoint
CREATE TYPE "public"."gallery_item_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "gallery_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" "gallery_category" NOT NULL,
	"event_date" timestamp with time zone,
	"description" text,
	"cover_image_url" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_albums_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"type" "gallery_item_type" NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"caption" text,
	"status" "content_status" DEFAULT 'pending_review' NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"rejection_reason" text,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cita_cita" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "social_links" jsonb;--> statement-breakpoint
ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_album_id_gallery_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_albums_category_idx" ON "gallery_albums" USING btree ("category");--> statement-breakpoint
CREATE INDEX "gallery_albums_created_at_idx" ON "gallery_albums" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gallery_items_album_status_idx" ON "gallery_items" USING btree ("album_id","status");--> statement-breakpoint
CREATE INDEX "gallery_items_status_idx" ON "gallery_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gallery_items_uploaded_by_idx" ON "gallery_items" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "profiles_slug_idx" ON "profiles" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_slug_unique" UNIQUE("slug");