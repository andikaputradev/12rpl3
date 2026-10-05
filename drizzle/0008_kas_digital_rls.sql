-- Kas Digital - RLS. Skema kas_settings ikut tergenerate bersama migration
-- 0006 (satu pemanggilan drizzle-kit generate untuk seluruh tabel baru rilis
-- ini), tapi RLS-nya sengaja dipisah ke berkas tersendiri di sini agar tetap
-- bisa diaudit terpisah dari kebijakan akses inti Fase 3 (jadwal/akademik).
--
-- Baca: seluruh role terautentikasi (siswa, pengurus, wali_kelas,
-- super_admin) - kas kelas bersifat internal, bukan konsumsi publik,
-- konsisten dengan rasionalisasi announcements ("berpotensi memuat instruksi
-- teknis kelas yang tidak relevan untuk pengunjung luar").
-- Mutasi: super_admin/wali_kelas saja - mengikuti pola staf Fase 3 (bukan
-- pola pengurus-inklusif moderasi galeri Fase 2), karena kas_settings adalah
-- data administratif/operasional kelas, sejenis dengan jadwal dan
-- pengumuman, bukan konten yang dimoderasi. Lihat catatan asumsi laporan.

alter table "kas_settings" enable row level security;
alter table "kas_settings" force row level security;

create policy "kas_settings_select_authenticated" on "kas_settings" for select to authenticated using (true);

create policy "kas_settings_mutate_staff" on "kas_settings" for all to authenticated using (
  is_academic_staff()
);
