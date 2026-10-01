CREATE TYPE "public"."guestbook_context" AS ENUM('umum', 'wisuda');--> statement-breakpoint
CREATE TABLE "aspirations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"author_id" uuid NOT NULL,
	"status" "content_status" NOT NULL,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context" "guestbook_context" DEFAULT 'umum' NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"author_id" uuid,
	"status" "content_status" DEFAULT 'pending_review' NOT NULL,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kelulusan_content" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"intro_text" text,
	"compilation_video_url" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pesan_kesan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_student_id" uuid NOT NULL,
	"to_student_id" uuid NOT NULL,
	"message" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"status" "content_status" NOT NULL,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pesan_kesan_from_to_unique" UNIQUE("from_student_id","to_student_id")
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"label" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_votes_poll_option_voter_unique" UNIQUE("poll_id","option_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"description" text,
	"allow_multiple_choice" boolean DEFAULT false NOT NULL,
	"show_results_before_close" boolean DEFAULT false NOT NULL,
	"opens_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closes_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "yearbook_quote" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "yearbook_photo_url" text;--> statement-breakpoint
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kelulusan_content" ADD CONSTRAINT "kelulusan_content_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesan_kesan" ADD CONSTRAINT "pesan_kesan_from_student_id_profiles_id_fk" FOREIGN KEY ("from_student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesan_kesan" ADD CONSTRAINT "pesan_kesan_to_student_id_profiles_id_fk" FOREIGN KEY ("to_student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesan_kesan" ADD CONSTRAINT "pesan_kesan_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_voter_id_profiles_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aspirations_status_idx" ON "aspirations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aspirations_author_idx" ON "aspirations" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "guestbook_entries_context_status_idx" ON "guestbook_entries" USING btree ("context","status");--> statement-breakpoint
CREATE INDEX "guestbook_entries_status_idx" ON "guestbook_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pesan_kesan_to_student_idx" ON "pesan_kesan" USING btree ("to_student_id");--> statement-breakpoint
CREATE INDEX "pesan_kesan_status_idx" ON "pesan_kesan" USING btree ("status");--> statement-breakpoint
CREATE INDEX "poll_options_poll_idx" ON "poll_options" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "poll_votes_poll_voter_idx" ON "poll_votes" USING btree ("poll_id","voter_id");--> statement-breakpoint
CREATE INDEX "polls_closes_at_idx" ON "polls" USING btree ("closes_at");