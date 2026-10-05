-- Fase 3 - RLS untuk seluruh tabel baru. Pola identik dengan
-- 0001/0003/0005: ENABLE + FORCE ROW LEVEL SECURITY, (select auth.uid())
-- (bukan auth.uid() polos, agar Postgres mengevaluasinya sekali sebagai
-- initplan alih-alih per baris), TO authenticated/anon eksplisit.
--
-- subjects tidak disertakan pada blok SQL prompt asli, tapi tetap diberi RLS
-- di sini mengikuti perintah eksplisit Bagian 0.2 brief: "pola default deny
-- lalu allow eksplisit wajib diteruskan tanpa pengecualian di seluruh tabel
-- baru fase ini" - tanpa kecuali berarti tanpa kecuali.

alter table "subjects" enable row level security;
alter table "subjects" force row level security;
create policy "subjects_select_public" on "subjects" for select to anon, authenticated using (true);
create policy "subjects_mutate_staff" on "subjects" for all to authenticated using (
  is_academic_staff()
);
--> statement-breakpoint

alter table "class_schedule" enable row level security;
alter table "class_schedule" force row level security;
create policy "class_schedule_select_public" on "class_schedule" for select to anon, authenticated using (true);
create policy "class_schedule_mutate_staff" on "class_schedule" for all to authenticated using (
  is_academic_staff()
);
--> statement-breakpoint

alter table "piket_schedule" enable row level security;
alter table "piket_schedule" force row level security;
create policy "piket_schedule_select_public" on "piket_schedule" for select to anon, authenticated using (true);
create policy "piket_schedule_mutate_staff" on "piket_schedule" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

alter table "piket_assignments" enable row level security;
alter table "piket_assignments" force row level security;
create policy "piket_assignments_select_public" on "piket_assignments" for select to anon, authenticated using (true);
create policy "piket_assignments_mutate_staff" on "piket_assignments" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

-- Nilai dan absensi: data akademik paling sensitif di seluruh proyek.
-- HANYA pemilik data (student_id = diri sendiri) dan staf akademik (wali_kelas,
-- super_admin) - role `pengurus` SENGAJA tidak disertakan, sesuai Bagian 9 brief.
alter table "grades" enable row level security;
alter table "grades" force row level security;
create policy "grades_select_own_or_staff" on "grades" for select to authenticated using (
  student_id = (select auth.uid())
  or is_academic_staff()
);
create policy "grades_mutate_staff_only" on "grades" for all to authenticated using (
  is_academic_staff()
);
--> statement-breakpoint

alter table "attendance" enable row level security;
alter table "attendance" force row level security;
create policy "attendance_select_own_or_staff" on "attendance" for select to authenticated using (
  student_id = (select auth.uid())
  or is_academic_staff()
);
create policy "attendance_mutate_staff_only" on "attendance" for all to authenticated using (
  is_academic_staff()
);
--> statement-breakpoint

-- Pengumuman dan tugas: seluruh peran terautentikasi boleh baca (termasuk
-- pengurus - brief tidak mengecualikannya di sini, berbeda dari nilai/
-- absensi), mutasi hanya staf akademik. Tidak untuk anon: bersifat internal kelas.

alter table "announcements" enable row level security;
alter table "announcements" force row level security;
create policy "announcements_select_authenticated" on "announcements" for select to authenticated using (true);
create policy "announcements_mutate_staff" on "announcements" for all to authenticated using (
  is_academic_staff()
);
--> statement-breakpoint

alter table "assignments" enable row level security;
alter table "assignments" force row level security;
create policy "assignments_select_authenticated" on "assignments" for select to authenticated using (true);
create policy "assignments_mutate_staff" on "assignments" for all to authenticated using (
  is_academic_staff()
);
--> statement-breakpoint

-- Kiriman tugas: siswa hanya melihat/meng-update miliknya sendiri -
-- mencegah kecurangan lewat menyalin jawaban siswa lain.

alter table "assignment_submissions" enable row level security;
alter table "assignment_submissions" force row level security;
create policy "submissions_select_own_or_staff" on "assignment_submissions" for select to authenticated using (
  student_id = (select auth.uid())
  or is_academic_staff()
);
create policy "submissions_insert_own" on "assignment_submissions" for insert to authenticated with check (
  student_id = (select auth.uid())
);
create policy "submissions_update_own_or_staff" on "assignment_submissions" for update to authenticated using (
  student_id = (select auth.uid())
  or is_academic_staff()
);
