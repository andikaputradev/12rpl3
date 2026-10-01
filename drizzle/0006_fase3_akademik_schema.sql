CREATE TYPE "public"."assessment_type" AS ENUM('tugas', 'uts', 'uas', 'praktik');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('hadir', 'sakit', 'izin', 'alpa');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('ujian', 'libur', 'deadline_tugas', 'event_sekolah', 'prakerin', 'kelulusan', 'lainnya');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by_staff" boolean DEFAULT false NOT NULL,
	CONSTRAINT "assignment_submissions_assignment_student_unique" UNIQUE("assignment_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"subject_id" uuid,
	"due_date" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "attendance_status" NOT NULL,
	"recorded_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_student_date_unique" UNIQUE("student_id","date")
);
--> statement-breakpoint
CREATE TABLE "class_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"period_number" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"subject_id" uuid,
	"teacher_name" text,
	"room" text,
	CONSTRAINT "class_schedule_day_period_unique" UNIQUE("day_of_week","period_number")
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"assessment_type" "assessment_type" NOT NULL,
	"score" integer NOT NULL,
	"semester" text NOT NULL,
	"entered_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grades_student_subject_type_semester_unique" UNIQUE("student_id","subject_id","assessment_type","semester"),
	CONSTRAINT "grades_score_range" CHECK ("grades"."score" >= 0 AND "grades"."score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "kas_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"qris_image_url" text,
	"dana_number" text,
	"dana_account_name" text,
	"nominal_info" text,
	"instructions" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "piket_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piket_schedule_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	CONSTRAINT "piket_assignments_schedule_student_unique" UNIQUE("piket_schedule_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "piket_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"note" text,
	CONSTRAINT "piket_schedule_day_of_week_unique" UNIQUE("day_of_week")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "academic_events" ADD COLUMN "category" "event_category" DEFAULT 'lainnya' NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_entered_by_profiles_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas_settings" ADD CONSTRAINT "kas_settings_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piket_assignments" ADD CONSTRAINT "piket_assignments_piket_schedule_id_piket_schedule_id_fk" FOREIGN KEY ("piket_schedule_id") REFERENCES "public"."piket_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piket_assignments" ADD CONSTRAINT "piket_assignments_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_pinned_created_idx" ON "announcements" USING btree ("is_pinned","created_at");--> statement-breakpoint
CREATE INDEX "assignment_submissions_student_idx" ON "assignment_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "assignments_due_date_idx" ON "assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "attendance_student_idx" ON "attendance" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "class_schedule_day_idx" ON "class_schedule" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "grades_student_semester_idx" ON "grades" USING btree ("student_id","semester");--> statement-breakpoint
CREATE INDEX "grades_subject_type_semester_idx" ON "grades" USING btree ("subject_id","assessment_type","semester");--> statement-breakpoint
CREATE INDEX "piket_assignments_schedule_idx" ON "piket_assignments" USING btree ("piket_schedule_id");--> statement-breakpoint
CREATE INDEX "academic_events_category_idx" ON "academic_events" USING btree ("category");