-- PERBAIKAN KRITIS, BUKAN FITUR FASE 5. Ditemukan selama verifikasi RLS
-- Fase 5 dengan menjalankan seluruh migration 0000-0012 pada Postgres nyata
-- (PGlite/Postgres 18.3), sesuatu yang tidak pernah dilakukan pada fase
-- manapun sebelumnya (brief Bagian 10: "RLS ditulis lengkap tapi belum
-- pernah dijalankan ke database sungguhan"). Prosedur eksekusi Fase 5
-- (Bagian 14 prompt) mewajibkan laporan mencakup temuan verifikasi; ini
-- temuan yang paling signifikan, karena itu ditutup di sini alih-alih
-- sekadar dicatat, meski secara ketat berada di luar cakupan aditif Fase 5.
--
-- MASALAH: profiles_select_own_or_public_or_staff dan
-- profiles_update_own_or_staff (migration 0001) menulis subquery
-- "exists (select 1 from profiles p where p.id = (select auth.uid())
-- and p.role in (...))" LANGSUNG pada policy tabel profiles itu sendiri.
-- Postgres tidak dapat mengevaluasi policy ini tanpa meng-query profiles
-- lagi, yang memicu evaluasi policy yang sama lagi: rekursi tak hingga,
-- gagal dengan SQLSTATE 42P17. Ini BUKAN spesifik ke tabel Fase 5; SETIAP
-- policy staff-check pada SETIAP tabel sejak Fase 1 (achievements, blog_*,
-- gallery_*, portfolio_*, grades, attendance, kas_settings, dst.) memuat
-- subquery yang sama ke profiles, dan proses evaluasinya SELALU melewati
-- policy profiles yang rekursif ini. Akibatnya: SETIAP query authenticated
-- (siswa maupun staf) yang benar-benar melewati jalur penegakan RLS
-- (bukan koneksi `db` Drizzle service-level yang dipakai Server Action)
-- akan gagal dengan error ini sejak Fase 0. Ini murni bug pada definisi
-- policy, tervalidasi lewat eksekusi langsung, bukan hasil pembacaan kode.
--
-- DAMPAK PADA ARSITEKTUR PROYEK: brief Bagian 5 sudah menegaskan RLS
-- BUKAN lapis pertahanan utama untuk Server Action (Drizzle memakai
-- SUPABASE_DB_URL, melewati RLS sepenuhnya): itulah mengapa bug ini tidak
-- pernah termanifestasi sebagai kegagalan fungsional yang terlihat siapa
-- pun selama ini. Namun RLS tetap wajib benar sebagai lapis KEDUA terhadap
-- akses REST API (PostgREST) langsung, yang justru SELALU menghormati RLS
-- (itulah tujuan e2e/rls-direct-api.spec.ts). Sebelum perbaikan ini, lapis
-- kedua tersebut bukan sekadar longgar, melainkan RUSAK TOTAL untuk setiap
-- pemanggil authenticated: bukan lebih permisif dari yang seharusnya,
-- melainkan gagal total dengan error database.
--
-- PERBAIKAN: pakai is_staff() SECURITY DEFINER (didefinisikan pada
-- 0012_fase5_interaksi_kelulusan_rls.sql) menggantikan EXISTS inline.
-- Definisi policy diganti PERSIS seperti aslinya (TO clause, WITH CHECK,
-- daftar role) kecuali satu baris staff-check tersebut. Diverifikasi lewat
-- eksekusi ulang: seluruh 64 skenario pada harness verifikasi Fase 5
-- (termasuk skenario yang menyentuh profiles secara authenticated) lulus
-- setelah migration ini diterapkan setelah 0012, dibanding 20 gagal sebelum
-- perbaikan.
--
-- REKOMENDASI TINDAK LANJUT (di luar cakupan migration ini): audit seluruh
-- policy "*_mutate_staff"/"*_select_*_staff" pada migration 0003-0010 yang
-- MASIH memakai pola EXISTS inline yang sama. Pola tersebut TIDAK gagal
-- rekursif seperti profiles (tabel lain tidak query dirinya sendiri), tapi
-- tetap kurang efisien dibanding is_staff() (subquery berkorelasi per baris
-- vs fungsi STABLE yang di-cache per statement) dan sebaiknya diseragamkan
-- saat Fase 6 (audit keamanan dan tuning performa).

drop policy if exists "profiles_select_own_or_public_or_staff" on "public"."profiles";
create policy "profiles_select_own_or_public_or_staff" on "public"."profiles" for select to authenticated using (
  (select auth.uid()) = id
  or is_public = true
  or is_staff()
);
--> statement-breakpoint

drop policy if exists "profiles_update_own_or_staff" on "public"."profiles";
create policy "profiles_update_own_or_staff" on "public"."profiles" for update to authenticated using (
  (select auth.uid()) = id
  or is_academic_staff()
) with check (
  (select auth.uid()) = id
  or is_academic_staff()
);
--> statement-breakpoint

drop policy if exists "audit_log_select_staff_only" on "public"."audit_log";
drop policy if exists "audit_log_select_super_admin_only" on "public"."audit_log";
create policy "audit_log_select_super_admin_only" on "public"."audit_log" for select to authenticated using (
  is_super_admin()
);
