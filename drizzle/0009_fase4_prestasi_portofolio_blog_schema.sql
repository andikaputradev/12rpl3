CREATE TYPE "public"."achievement_level" AS ENUM('sekolah', 'kabupaten', 'provinsi', 'nasional', 'internasional');--> statement-breakpoint
CREATE TABLE "achievement_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"achievement_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	CONSTRAINT "achievement_participants_unique" UNIQUE("achievement_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"level" "achievement_level" NOT NULL,
	"event_date" timestamp with time zone,
	"certificate_url" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alumni_testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"quote" text NOT NULL,
	"context_note" text,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "blog_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content_markdown" text NOT NULL,
	"excerpt" text,
	"cover_image_url" text,
	"category_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "content_status" DEFAULT 'pending_review' NOT NULL,
	"author_id" uuid NOT NULL,
	"moderated_by" uuid,
	"rejection_reason" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "portfolio_contributors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	CONSTRAINT "portfolio_contributors_unique" UNIQUE("project_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tech_stack" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"project_url" text,
	"repo_url" text,
	"thumbnail_url" text,
	"status" "content_status" DEFAULT 'pending_review' NOT NULL,
	"submitted_by" uuid NOT NULL,
	"moderated_by" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievement_participants" ADD CONSTRAINT "achievement_participants_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_participants" ADD CONSTRAINT "achievement_participants_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_testimonials" ADD CONSTRAINT "alumni_testimonials_added_by_profiles_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_hidden_by_profiles_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_contributors" ADD CONSTRAINT "portfolio_contributors_project_id_portfolio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."portfolio_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_contributors" ADD CONSTRAINT "portfolio_contributors_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievement_participants_achievement_idx" ON "achievement_participants" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "achievements_level_idx" ON "achievements" USING btree ("level");--> statement-breakpoint
CREATE INDEX "achievements_event_date_idx" ON "achievements" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "blog_comments_post_idx" ON "blog_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_posts_status_published_idx" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "blog_posts_author_idx" ON "blog_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "portfolio_contributors_project_idx" ON "portfolio_contributors" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "portfolio_projects_status_idx" ON "portfolio_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portfolio_projects_submitted_by_idx" ON "portfolio_projects" USING btree ("submitted_by");