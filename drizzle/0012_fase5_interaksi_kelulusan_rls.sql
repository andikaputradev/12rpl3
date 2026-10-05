-- Fase 5: RLS seluruh tabel baru (Interaksi & Corner Kelulusan). Pola identik
-- 0001/0003/0005/0007/0008/0010: (select auth.uid()), TO anon/authenticated
-- eksplisit, FORCE ROW LEVEL SECURITY.
--
-- Penyesuaian terhadap RLS pada prompt Fase 5 asli, didokumentasikan eksplisit
-- (pola sama seperti subjects/blog_categories/portfolio_contributors pada
-- fase-fase sebelumnya):
--   1. Setiap "auth.uid()" polos pada prompt dibungkus (select auth.uid())
--      untuk performa RLS (konvensi wajib Bagian 7 brief, planner Postgres
--      mengevaluasi sekali per query alih-alih sekali per baris).
--   2. Setiap ENABLE ROW LEVEL SECURITY dipasangkan FORCE ROW LEVEL SECURITY
--      (prompt hanya menyebut ENABLE): konvensi mutlak di seluruh migration
--      proyek ini sejak 0001.
--   3. Setiap policy insert/update/mutate staf diberi "TO authenticated"
--      eksplisit (prompt tidak selalu mencantumkannya). SATU-SATUNYA
--      pengecualian yang dipertahankan adalah guestbook_insert_anyone
--      ("TO anon, authenticated"), sesuai Asumsi Kunci #2: buku tamu adalah
--      satu-satunya jalur tulis tanpa autentikasi di seluruh sistem.
--   4. aspirations_select_approved_or_own_or_staff dipersempit ke
--      "TO authenticated" (prompt tidak mencantumkan TO sama sekali, yang
--      berarti default PUBLIC termasuk anon): Bagian 5 prompt eksplisit
--      mewajibkan login untuk seluruh halaman Papan Aspirasi ("peran apapun"),
--      bukan hanya untuk mengirim. pesan_kesan dan guestbook TETAP publik
--      (to anon, authenticated) karena keduanya memang ditampilkan di
--      halaman publik tanpa syarat login (Bagian 6 & 10 prompt).
--   5. poll_options TIDAK diberi policy mutate sama sekali pada blok RLS
--      prompt (hanya select): celah ditutup dengan poll_options_mutate_staff,
--      karena createPoll menulis baris opsi sekaligus saat membuat polling
--      (pola sama seperti penutupan celah portfolio_contributors/
--      blog_categories di Fase 4).
--   6. kelulusan_content_update_staff SENGAJA dipertahankan HANYA
--      ('super_admin','wali_kelas') persis seperti tertulis di prompt:
--      diverifikasi silang terhadap class_profile_update_staff (0003), pola
--      yang sudah ada: konten narasi resmi singleton mengecualikan pengurus,
--      berbeda dari tabel bersifat moderasi konten (guestbook/aspirations/
--      pesan_kesan/polls) yang menyertakan pengurus. requireStaffRole pada
--      updateKelulusanContent (lib/actions/admin-kelulusan-mutations.ts)
--      disamakan persis agar kedua lapis (Server Action & RLS) konsisten.
--   7. WITH CHECK seluruh policy insert konten yang dimoderasi DIPERKETAT
--      (prompt: "with check (true)" pada buku tamu, hanya cek kepemilikan
--      pada aspirations/pesan_kesan). Tanpa pengetatan ini pemanggil REST
--      langsung (kunci anon bersifat publik by design) dapat menyetel
--      status='approved' sendiri dan menayangkan konten TANPA moderasi,
--      yang bertentangan dengan invarian Bagian 9 prompt ("pre-moderasi
--      tidak bisa dilewati lapis otomatis manapun"). Aturan: status awal
--      hanya pending_review, atau approved khusus konten NON-anonim
--      (Asumsi Kunci #3), moderated_by harus kosong, batas panjang teks
--      sama dengan skema Zod di sisi server, dan pemalsuan author_id ditolak.
--   8. Hak SELECT kolom identitas pengirim (author_id/from_student_id/
--      moderated_by) dicabut dari anon/authenticated. Anonimitas pada Bagian
--      9 prompt disengaja hanya di lapisan presentasi, tetapi tanpa langkah
--      ini setiap siswa RPL yang memakai kunci anon publik dapat membaca
--      identitas seluruh pengirim anonim lewat satu query PostgREST. Server
--      Action memakai koneksi `db` langsung (tidak terkena hak kolom), jadi
--      perilaku aplikasi dan akses staf tidak berubah.
--   9. Trigger poll_votes_enforce_rules menegakkan di level database: polling
--      sedang dibuka, opsi milik polling yang sama, dan satu pilihan per
--      pemilih untuk polling single-choice. Advisory lock per (polling,
--      pemilih) menutup race TOCTOU pada submitVote sekaligus jalur REST
--      langsung yang sebelumnya hanya dijaga Server Action.
--   10. [TEMUAN KRITIS, DI LUAR CAKUPAN FITUR FASE 5, LIHAT MIGRATION 0013]
--       Seluruh policy staff-check pada fase-fase sebelumnya (termasuk
--       profiles_select_own_or_public_or_staff dan profiles_update_own_or_staff
--       di 0001) menulis subquery "exists (select 1 from profiles p where
--       p.id = (select auth.uid()) and p.role in (...))" LANGSUNG pada
--       policy tabel profiles ITU SENDIRI. Ini self-reference: mengevaluasi
--       policy profiles memerlukan meng-query profiles lagi, yang memicu
--       evaluasi policy profiles lagi, dan seterusnya. Diverifikasi lewat
--       eksekusi nyata (PGlite/Postgres 18.3, bukan cuma dibaca): setiap
--       query authenticated yang menyentuh subquery ini gagal dengan
--       "42P17: infinite recursion detected in policy for relation
--       profiles". anon lolos hanya karena auth.uid() bernilai NULL
--       sehingga predikat "p.id = NULL" dioptimasi planner menjadi false
--       tanpa pernah menyentuh RLS profiles; SIAPA PUN yang login (siswa
--       maupun staf) sejak Fase 0 akan mengalami ini pada query yang
--       memuat subquery staf tersebut, kapan pun jalur yang dipakai
--       benar-benar menghormati RLS (bukan koneksi `db` Drizzle langsung).
--       Fungsi is_staff() di bawah memutus rekursi ini (SECURITY DEFINER,
--       lihat migration 0013 untuk perbaikan retroaktif profiles/audit_log)
--       dan dipakai di seluruh policy Fase 5 di bawah menggantikan pola
--       EXISTS inline pada draf awal migration ini.

-- Helper SECURITY DEFINER untuk memutus rekursi RLS di atas: query di dalam
-- fungsi ini berjalan dengan privilese pemilik fungsi (bypass RLS profiles),
-- bukan privilese pemanggil, sehingga TIDAK memicu evaluasi ulang policy
-- profiles. STABLE (bukan VOLATILE) agar Postgres boleh men-cache hasilnya
-- dalam satu statement. Diverifikasi lewat eksekusi nyata: pola lama gagal
-- 42P17, pola dengan fungsi ini sukses, pada Postgres yang sama persis.
create or replace function "public".is_staff(uid uuid, allowed_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles p where p.id = uid and p.role::text = any(allowed_roles)
  );
$$;
revoke all on function "public".is_staff(uuid, text[]) from public;
grant execute on function "public".is_staff(uuid, text[]) to anon, authenticated;
--> statement-breakpoint

alter table "guestbook_entries" enable row level security;
alter table "guestbook_entries" force row level security;
create policy "guestbook_select_approved_or_staff" on "guestbook_entries" for select to anon, authenticated using (
  status = 'approved'
  or is_staff()
);
-- SATU-SATUNYA policy insert "to anon, authenticated" di seluruh proyek:
-- lihat Asumsi Kunci #2 prompt Fase 5 dan Bagian 9 (tiga lapis pertahanan
-- non-RLS: Turnstile, honeypot, rate limit per-IP; pre-moderasi tetap wajib).
-- WITH CHECK diperketat, lihat catatan penyesuaian #7 di atas.
create policy "guestbook_insert_anyone" on "guestbook_entries" for insert to anon, authenticated with check (
  status = 'pending_review'
  and moderated_by is null
  and (author_id is null or author_id = (select auth.uid()))
  and char_length(btrim(name)) between 2 and 80
  and char_length(btrim(message)) between 5 and 500
);
create policy "guestbook_mutate_staff" on "guestbook_entries" for update to authenticated using (
  is_staff()
);
revoke select on "guestbook_entries" from anon, authenticated;
grant select ("id", "context", "name", "message", "status", "created_at") on "guestbook_entries" to anon, authenticated;
--> statement-breakpoint

alter table "aspirations" enable row level security;
alter table "aspirations" force row level security;
-- TO authenticated (bukan anon): lihat catatan penyesuaian #4 di atas.
create policy "aspirations_select_approved_or_own_or_staff" on "aspirations" for select to authenticated using (
  status = 'approved'
  or author_id = (select auth.uid())
  or is_staff()
);
create policy "aspirations_insert_authenticated" on "aspirations" for insert to authenticated with check (
  (select auth.uid()) = author_id
  and moderated_by is null
  and (status = 'pending_review' or (status = 'approved' and is_anonymous = false))
  and char_length(btrim(content)) between 10 and 1000
);
create policy "aspirations_mutate_staff" on "aspirations" for update to authenticated using (
  is_staff()
);
revoke select on "aspirations" from anon, authenticated;
grant select ("id", "content", "is_anonymous", "status", "created_at") on "aspirations" to authenticated;
--> statement-breakpoint

alter table "polls" enable row level security;
alter table "polls" force row level security;
create policy "polls_select_public" on "polls" for select to anon, authenticated using (true);
create policy "polls_mutate_staff" on "polls" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

alter table "poll_options" enable row level security;
alter table "poll_options" force row level security;
create policy "poll_options_select_public" on "poll_options" for select to anon, authenticated using (true);
-- Celah ditutup (lihat catatan penyesuaian #5 di atas): prompt hanya
-- menyertakan policy select untuk tabel ini.
create policy "poll_options_mutate_staff" on "poll_options" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

-- Suara: baris mentah HANYA terlihat oleh pemilik suara sendiri dan staf;
-- publik hanya melihat agregat lewat get_poll_results() di bawah, menjaga
-- prinsip bilik suara rahasia (Bagian 9 prompt).
alter table "poll_votes" enable row level security;
alter table "poll_votes" force row level security;
create policy "votes_select_own_or_staff" on "poll_votes" for select to authenticated using (
  voter_id = (select auth.uid())
  or is_staff()
);
create policy "votes_insert_own" on "poll_votes" for insert to authenticated with check (
  (select auth.uid()) = voter_id
);
--> statement-breakpoint

-- Integritas suara di level database (catatan penyesuaian #9). SECURITY
-- DEFINER agar pemeriksaan duplikat melihat SELURUH baris suara, bukan hanya
-- baris yang lolos RLS pemanggil. Kode SQLSTATE khusus (PV001 sampai PV003)
-- dipetakan ke pesan ramah pengguna oleh submitVote.
create or replace function "public".enforce_poll_vote_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_poll polls%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.poll_id::text || ':' || new.voter_id::text, 0));

  select * into target_poll from polls where id = new.poll_id;
  if not found then
    raise exception 'Polling tidak ditemukan.' using errcode = 'PV002';
  end if;

  if target_poll.opens_at > now()
     or (target_poll.closes_at is not null and target_poll.closes_at <= now()) then
    raise exception 'Polling tidak sedang dibuka.' using errcode = 'PV002';
  end if;

  if not exists (
    select 1 from poll_options o where o.id = new.option_id and o.poll_id = new.poll_id
  ) then
    raise exception 'Opsi tidak valid untuk polling ini.' using errcode = 'PV003';
  end if;

  if not target_poll.allow_multiple_choice and exists (
    select 1 from poll_votes v where v.poll_id = new.poll_id and v.voter_id = new.voter_id
  ) then
    raise exception 'Anda sudah memilih pada polling ini.' using errcode = 'PV001';
  end if;

  return new;
end;
$$;
--> statement-breakpoint

revoke all on function "public".enforce_poll_vote_rules() from public;
--> statement-breakpoint

create trigger poll_votes_enforce_rules
  before insert on "poll_votes"
  for each row execute function "public".enforce_poll_vote_rules();
--> statement-breakpoint

create or replace function "public".get_poll_results(target_poll_id uuid)
returns table(option_id uuid, vote_count bigint)
language sql
security definer
set search_path = public
as $$
  select option_id, count(*)::bigint
  from poll_votes
  where poll_id = target_poll_id
  group by option_id;
$$;
--> statement-breakpoint

revoke all on function "public".get_poll_results(uuid) from public;
grant execute on function "public".get_poll_results(uuid) to anon, authenticated;
--> statement-breakpoint

-- Pesan kesan: penerima dan pengirim selalu melihat baris miliknya (termasuk
-- yang masih pending), publik hanya melihat yang approved (feed publik
-- Bagian 6 prompt, halaman /kelulusan tidak mewajibkan login). Penyembunyian
-- nama pengirim untuk pesan anonim tetap keputusan presentasi di Server
-- Action (Bagian 9 & Asumsi Kunci #4 prompt); kolom from_student_id
-- ditutup dari SELECT langsung lewat hak kolom (catatan penyesuaian #8).
alter table "pesan_kesan" enable row level security;
alter table "pesan_kesan" force row level security;
create policy "pesan_kesan_select_visible" on "pesan_kesan" for select to anon, authenticated using (
  status = 'approved'
  or to_student_id = (select auth.uid())
  or from_student_id = (select auth.uid())
  or is_staff()
);
create policy "pesan_kesan_insert_own" on "pesan_kesan" for insert to authenticated with check (
  (select auth.uid()) = from_student_id
  and from_student_id <> to_student_id
  and moderated_by is null
  and (status = 'pending_review' or (status = 'approved' and is_anonymous = false))
  and char_length(btrim(message)) between 10 and 1000
);
create policy "pesan_kesan_mutate_staff" on "pesan_kesan" for update to authenticated using (
  is_staff()
);
revoke select on "pesan_kesan" from anon, authenticated;
grant select ("id", "to_student_id", "message", "is_anonymous", "status", "created_at") on "pesan_kesan" to anon, authenticated;
--> statement-breakpoint

alter table "kelulusan_content" enable row level security;
alter table "kelulusan_content" force row level security;
create policy "kelulusan_content_select_public" on "kelulusan_content" for select to anon, authenticated using (true);
-- SENGAJA HANYA super_admin/wali_kelas (TANPA pengurus): lihat catatan
-- penyesuaian #6 di atas, disamakan dengan class_profile_update_staff (0003),
-- bukan dengan pola moderasi konten tiga-role di atas.
create policy "kelulusan_content_update_staff" on "kelulusan_content" for update to authenticated using (
  is_academic_staff()
);

insert into "kelulusan_content" (id) values (1)
on conflict (id) do nothing;
