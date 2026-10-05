-- ============================================================================
-- FASE 6: AUDIT KEAMANAN MENYELURUH DAN HARDENING PRODUKSI
-- Migrasi Konsolidasi RBAC, Pengerasan RLS, dan Penutupan Celah Keamanan
-- ============================================================================

-- 1. Refactor Konsolidasi: Fungsi Otorisasi Tunggal
-- Menggantikan penulisan subquery berulang "exists (select 1 from profiles...)"
-- Menjamin evaluasi non-rekursif (SECURITY DEFINER) dan di-cache per statement (STABLE).

CREATE OR REPLACE FUNCTION "public".auth_role() RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT role::text FROM profiles WHERE id = auth.uid() $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public".is_staff() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT auth_role() IN ('super_admin', 'wali_kelas', 'pengurus') $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public".is_academic_staff() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT auth_role() IN ('super_admin', 'wali_kelas') $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public".is_super_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT auth_role() = 'super_admin' $$;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION "public".auth_role() TO anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "public".is_staff() TO anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "public".is_academic_staff() TO anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "public".is_super_admin() TO anon, authenticated;
--> statement-breakpoint

-- 2. Temuan Audit Bagian 2: Penutupan Celah 3 Tabel

-- A. audit_log: Hanya boleh diakses oleh super_admin, tanpa hak mutasi client
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."audit_log" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "audit_log_select_staff_only" ON "public"."audit_log";
--> statement-breakpoint
DROP POLICY IF EXISTS "audit_log_select_super_admin_only" ON "public"."audit_log";
--> statement-breakpoint
CREATE POLICY "audit_log_select_super_admin_only" ON "public"."audit_log"
FOR SELECT TO authenticated USING (is_super_admin());
--> statement-breakpoint

-- B. blog_categories: Publik dapat membaca, mutasi hanya staf
ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."blog_categories" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "blog_categories_select_public" ON "public"."blog_categories";
--> statement-breakpoint
DROP POLICY IF EXISTS "blog_categories_mutate_staff" ON "public"."blog_categories";
--> statement-breakpoint
CREATE POLICY "blog_categories_select_public" ON "public"."blog_categories"
FOR SELECT TO anon, authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "blog_categories_mutate_staff" ON "public"."blog_categories"
FOR ALL TO authenticated USING (is_staff());
--> statement-breakpoint

-- C. portfolio_contributors: Visibilitas mewarisi project induk, mutasi staf
ALTER TABLE "public"."portfolio_contributors" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."portfolio_contributors" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_contributors_select" ON "public"."portfolio_contributors";
--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_contributors_select_matches_project" ON "public"."portfolio_contributors";
--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_contributors_insert_own_project" ON "public"."portfolio_contributors";
--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_contributors_mutate_staff" ON "public"."portfolio_contributors";
--> statement-breakpoint
CREATE POLICY "portfolio_contributors_select_matches_project" ON "public"."portfolio_contributors"
FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects pp
    WHERE pp.id = portfolio_contributors.project_id
      AND (pp.status = 'approved' OR pp.submitted_by = auth.uid() OR is_staff())
  )
);
--> statement-breakpoint
CREATE POLICY "portfolio_contributors_mutate_staff" ON "public"."portfolio_contributors"
FOR ALL TO authenticated USING (is_staff());
--> statement-breakpoint

-- 3. Verifikasi Seluruh Tabel Publik Memiliki RLS Aktif dan Terpaksa (FORCE RLS)
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_profile" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."beranda_highlights" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."beranda_highlights" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."academic_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."academic_events" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."visitor_count" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."visitor_count" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."gallery_albums" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."gallery_albums" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."gallery_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."gallery_items" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subjects" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_schedule" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."piket_schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."piket_schedule" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."piket_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."piket_assignments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."grades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."grades" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attendance" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."announcements" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignment_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignment_submissions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."kas_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."kas_settings" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."achievements" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."achievement_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."achievement_participants" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."portfolio_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."portfolio_projects" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."alumni_testimonials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."alumni_testimonials" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blog_posts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blog_comments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."guestbook_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guestbook_entries" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."aspirations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."aspirations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."polls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."polls" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_options" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_votes" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."pesan_kesan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pesan_kesan" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."kelulusan_content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."kelulusan_content" FORCE ROW LEVEL SECURITY;
