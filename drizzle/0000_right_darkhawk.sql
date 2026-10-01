CREATE TYPE "public"."content_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'wali_kelas', 'pengurus', 'siswa');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"table_name" text NOT NULL,
	"record_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"nis" text,
	"absen_number" integer,
	"role" "role" DEFAULT 'siswa' NOT NULL,
	"jabatan" text,
	"avatar_url" text,
	"bio" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_nis_unique" UNIQUE("nis")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_table_record_idx" ON "audit_log" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "profiles_is_public_idx" ON "profiles" USING btree ("is_public");