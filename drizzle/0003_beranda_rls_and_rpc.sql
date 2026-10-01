ALTER TABLE "public"."class_profile" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."class_profile" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."beranda_highlights" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."beranda_highlights" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."academic_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."academic_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."visitor_count" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."visitor_count" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "class_profile_select_public"
ON "public"."class_profile" FOR SELECT
TO anon, authenticated
USING (true);
--> statement-breakpoint

CREATE POLICY "class_profile_update_staff"
ON "public"."class_profile" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas')
  )
);
--> statement-breakpoint

CREATE POLICY "highlights_select_active_or_staff"
ON "public"."beranda_highlights" FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

CREATE POLICY "highlights_insert_staff"
ON "public"."beranda_highlights" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

CREATE POLICY "highlights_update_staff"
ON "public"."beranda_highlights" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

CREATE POLICY "highlights_delete_staff"
ON "public"."beranda_highlights" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

CREATE POLICY "events_select_public"
ON "public"."academic_events" FOR SELECT
TO anon, authenticated
USING (true);
--> statement-breakpoint

CREATE POLICY "events_insert_staff"
ON "public"."academic_events" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas')
  )
);
--> statement-breakpoint

CREATE POLICY "events_update_staff"
ON "public"."academic_events" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas')
  )
);
--> statement-breakpoint

CREATE POLICY "events_delete_staff"
ON "public"."academic_events" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas')
  )
);
--> statement-breakpoint

CREATE POLICY "visitor_count_select_public"
ON "public"."visitor_count" FOR SELECT
TO anon, authenticated
USING (true);
--> statement-breakpoint

-- Sengaja TANPA policy insert/update untuk anon/authenticated: perubahan
-- angka hanya lewat fungsi security definer di bawah, agar tidak bisa
-- dimanipulasi lewat panggilan langsung ke REST API Supabase (mis. PATCH
-- /rest/v1/visitor_count dengan nilai sembarang). RLS default deny menutup
-- seluruh jalur tulis langsung.

INSERT INTO "public"."visitor_count" (id, total) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public".increment_visitor_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total integer;
BEGIN
  UPDATE public.visitor_count
  SET total = total + 1, updated_at = now()
  WHERE id = 1
  RETURNING total INTO new_total;

  RETURN new_total;
END;
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION "public".increment_visitor_count() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "public".increment_visitor_count() TO anon, authenticated;
