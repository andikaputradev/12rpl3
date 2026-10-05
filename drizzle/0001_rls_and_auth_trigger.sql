-- Foreign key profiles.id -> auth.users.id. Ditulis manual karena skema
-- `auth` berada di luar jangkauan introspeksi Drizzle Kit.
ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
--> statement-breakpoint

-- Fungsi Otorisasi Tunggal (Fase 6 Refactor Konsolidasi):
-- SECURITY DEFINER memutus evaluasi RLS melingkar pada tabel profiles.
-- STABLE agar dapat di-cache per statement oleh perencana kueri Postgres.
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

-- Default deny: RLS aktif di seluruh tabel sejak awal.
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."profiles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."audit_log" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "profiles_select_own_or_public_or_staff"
ON "public"."profiles" FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = id
  OR is_public = true
  OR is_staff()
);
--> statement-breakpoint

CREATE POLICY "profiles_update_own_or_staff"
ON "public"."profiles" FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = id
  OR is_academic_staff()
)
WITH CHECK (
  (select auth.uid()) = id
  OR is_academic_staff()
);
--> statement-breakpoint

CREATE POLICY "audit_log_select_super_admin_only"
ON "public"."audit_log" FOR SELECT
TO authenticated
USING (
  is_super_admin()
);
--> statement-breakpoint

-- Tidak ada policy INSERT/UPDATE/DELETE untuk audit_log dari role client
-- manapun: penulisan audit trail hanya lewat jalur tepercaya (service role
-- atau fungsi SECURITY DEFINER) yang akan ditambahkan bersamaan dengan
-- mutasi data pada fase-fase berikutnya. RLS default deny menutup sisanya.

CREATE OR REPLACE FUNCTION "public".handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Pengguna Baru'),
    'siswa'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION "public".handle_new_auth_user() FROM PUBLIC;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION "public".handle_new_auth_user();
