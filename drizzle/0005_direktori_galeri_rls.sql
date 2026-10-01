ALTER TABLE "public"."gallery_albums" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."gallery_albums" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."gallery_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."gallery_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "albums_select_public"
ON "public"."gallery_albums" FOR SELECT
TO anon, authenticated
USING (true);
--> statement-breakpoint

CREATE POLICY "albums_insert_staff"
ON "public"."gallery_albums" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

CREATE POLICY "albums_update_staff"
ON "public"."gallery_albums" FOR UPDATE
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

CREATE POLICY "albums_delete_staff"
ON "public"."gallery_albums" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

CREATE POLICY "items_select_approved_or_own_or_staff"
ON "public"."gallery_items" FOR SELECT
TO authenticated
USING (
  status = 'approved'
  OR uploaded_by = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
--> statement-breakpoint

-- Pengunjung anonim (belum login) hanya melihat item approved — dipisah dari
-- policy authenticated di atas karena kondisi "uploaded_by = auth.uid()"
-- tidak relevan/valid untuk peran anon.
CREATE POLICY "items_select_approved_anon"
ON "public"."gallery_items" FOR SELECT
TO anon
USING (status = 'approved');
--> statement-breakpoint

CREATE POLICY "items_insert_authenticated"
ON "public"."gallery_items" FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL AND uploaded_by = (select auth.uid()));
--> statement-breakpoint

-- SENGAJA tanpa policy UPDATE untuk pengunggah atas barisnya sendiri: siswa
-- hanya diberi INSERT + SELECT, tidak pernah UPDATE, agar status
-- 'pending_review' tidak bisa diubah sendiri lewat panggilan langsung ke
-- Supabase REST API (mis. PATCH .../gallery_items?id=eq.<miliknya>).
CREATE POLICY "items_update_staff_only"
ON "public"."gallery_items" FOR UPDATE
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

CREATE POLICY "items_delete_staff_only"
ON "public"."gallery_items" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    WHERE p.id = (select auth.uid()) AND p.role IN ('super_admin', 'wali_kelas', 'pengurus')
  )
);
