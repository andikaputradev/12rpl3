# Portal XII RPL 3 - SMK Negeri 1 Sukoharjo

Portal identitas digital Kelas XII RPL 3. Fase 0-5 selesai: fondasi teknis, beranda/profil, direktori/galeri, jadwal/akademik/kas digital, prestasi/portofolio/blog, dan interaksi/Corner Kelulusan. Fase 6 (QA menyeluruh, audit keamanan, tuning performa, hardening produksi, tanpa fitur baru) belum dimulai.

## Tech Stack

Next.js 16.2.12 (App Router, Turbopack) · TypeScript 5.9.3 strict · Tailwind CSS v4 · shadcn/ui (komponen ditulis manual, lihat catatan di bawah) · Supabase (Postgres + Auth + RLS) · Drizzle ORM · Cloudinary (signed upload) · Upstash Redis (rate limiting) · Cloudflare Turnstile (CAPTCHA buku tamu, Fase 5) · date-fns + react-day-picker (kalender akademik, Fase 3) · Biome · Vitest · Playwright.

## Instalasi

```bash
corepack enable
pnpm install
cp .env.example .env.local   # isi seluruh variabel, lihat bagian Environment
pnpm db:generate               # opsional bila skema diubah
pnpm db:migrate                # menjalankan seluruh migration 0000-0013 ke Supabase
pnpm dev
```

Sebelum menerapkan migration ke Supabase sungguhan, disarankan `pnpm db:verify-rls` (Fase 5): menjalankan seluruh migration di atas Postgres nyata tanpa kredensial (lihat `scripts/verify-rls.mjs`), memverifikasi policy benar-benar menolak/mengizinkan sesuai desain sebelum menyentuh database produksi.

Prasyarat: Node.js ≥ 20.9 (direkomendasikan 24.x LTS untuk produksi), pnpm (via corepack), project Supabase, akun Cloudinary, database Upstash Redis.

## Environment Variables

Isi `.env.local` berdasarkan `.env.example`:

- **Supabase** - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari dashboard Supabase (Settings → API). `SUPABASE_DB_URL` **wajib** memakai connection string pooler transaction-mode (port 6543), bukan direct connection, karena `lib/db/index.ts` dikonfigurasi `prepare: false` untuk kompatibilitas PgBouncer.
- **Cloudinary** - `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET` dari Console → Settings → API Keys. Jangan pernah expose `CLOUDINARY_API_SECRET` ke client.
- **Upstash Redis** - buat database di console.upstash.com, salin REST URL dan token.
- **`NEXT_PUBLIC_GRADUATION_TARGET_DATE`** - format ISO 8601 (mis. `2027-05-15T08:00:00+07:00`), tanggal ujian/kelulusan resmi dari sekolah. StatusBar menampilkan pesan menunggu selama variabel ini kosong (bukan tanggal fiktif).
- **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** - wajib untuk deployment multi-instance (`openssl rand -base64 32`), memastikan Server Action ID konsisten antar instance Vercel.

## Setup Supabase

1. Buat project baru di supabase.com.
2. Jalankan migration: `pnpm db:migrate` (menerapkan `drizzle/0000_*.sql` dan `drizzle/0001_rls_and_auth_trigger.sql` - FK ke `auth.users`, RLS default-deny, trigger auto-provisioning profil).
3. Buat akun pertama (Super Admin) lewat Supabase Auth dashboard secara manual (registrasi bersifat invite-only, sesuai Asumsi Kunci #2 brief), lalu update kolom `role` pada tabel `profiles` menjadi `super_admin` lewat SQL Editor:
   ```sql
   update public.profiles set role = 'super_admin' where id = '<user-id-dari-auth.users>';
   ```

## Catatan shadcn/ui

Registry `ui.shadcn.com` tidak dapat diakses dari sandbox eksekusi saat proyek ini dibangun. Seluruh komponen di `components/ui/` ditulis manual mengikuti konvensi resmi shadcn (`new-york` style, berbasis Radix UI, `class-variance-authority`). `components.json` tetap disertakan - menjalankan `pnpm dlx shadcn@latest add <komponen>` dari mesin dengan akses internet penuh akan tetap kompatibel dan dapat menimpa/menambah komponen sesuai kebutuhan fase berikutnya.

## Keamanan - Ringkasan & Batasan

Baseline mengikuti OWASP Top 10:2025 (lihat `proxy.ts`, `next.config.ts`, `drizzle/0001_rls_and_auth_trigger.sql`). Beberapa trade-off eksplisit yang perlu diketahui, bukan "full secure" tanpa syarat:

- **CSP style-src**: elemen `<style>` dikunci nonce; atribut `style=""` inline diizinkan (`unsafe-inline`) karena Radix UI (positioning Popper untuk Dialog/DropdownMenu) menulis posisi via inline style yang tidak bisa diberi nonce. Elemen `<script>` tetap strict nonce + `strict-dynamic` tanpa pengecualian.
- **Rate limiter fail-open**: jika Upstash Redis tidak terjangkau, permintaan login tetap diteruskan (dicatat sebagai error di log) agar gangguan Redis tidak melumpuhkan seluruh alur autentikasi. Pemeriksaan RBAC/RLS tetap fail-closed tanpa pengecualian.
- **Verifikasi build lokal**: `next build` telah diverifikasi berhasil penuh (47 rute, `proxy.ts`, seluruh komponen termasuk Fase 5) di lingkungan pengembangan ini. Lighthouse dan Playwright E2E browser-based **tidak dapat dijalankan** pada sandbox eksekusi (tidak ada akses Chromium): wajib dijalankan di lingkungan CI/lokal Anda sebelum rilis produksi (`pnpm test:e2e`).
- **Verifikasi RLS terhadap Postgres nyata** (`pnpm db:verify-rls`, Fase 5): seluruh migration 0000-0013 dijalankan pada instans Postgres sekali pakai (PGlite, bukan mock) dan setiap policy diuji dengan peran berbeda. Ini yang pertama kali menjalankan RLS proyek ini terhadap database sungguhan sejak Fase 0; sebelumnya hanya dibaca kode, tidak pernah dieksekusi (lihat catatan Fase 5 di bawah untuk bug kritis yang ditemukan lewat verifikasi ini).
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` wajib diset di produksi multi-instance; tanpa ini, Server Action ID dapat berbeda antar instance Vercel dan menyebabkan error pada deployment yang sedang rolling update.

## Fase 1 - Beranda & Profil Kelas

Migration tambahan (aditif, dijalankan setelah `0000`/`0001` Fase 0):

- `0002_beranda_profil_schema.sql` - kolom baru `profiles` (gender, displayOrder, publicContact), tabel `class_profile`, `beranda_highlights`, `academic_events`, `visitor_count`.
- `0003_beranda_rls_and_rpc.sql` - RLS untuk keempat tabel baru, fungsi RPC `increment_visitor_count()` (satu-satunya jalur tulis ke `visitor_count`, tidak ada policy INSERT/UPDATE langsung untuk client manapun).

Setelah migrasi, isi konten sesungguhnya lewat `/dashboard/profil` (role `super_admin`/`wali_kelas`). Untuk data contoh pengembangan lokal: `pnpm db:seed` (lihat peringatan di `drizzle/seed.ts` - jangan pernah dijalankan terhadap database produksi).

**Upload gambar** (foto wali kelas, foto kelas, highlight) memvalidasi magic bytes berkas di server (`lib/cloudinary/validate-file.ts`) sebelum diteruskan ke Cloudinary - bukan pola *client unggah langsung dengan signature* seperti infrastruktur dasar Fase 0, karena volume rendah (staf saja) sehingga pemeriksaan penuh di server lebih diutamakan daripada penghematan bandwidth.

**OG image dinamis** (`app/(public)/opengraph-image.tsx`) memakai font Space Grotesk Bold yang dibundel lokal di `assets/fonts/` (diekstrak dari paket `@fontsource/space-grotesk`, lisensi OFL) - bukan fetch runtime ke Google Fonts, agar tidak bergantung pada akses jaringan saat render.

## Environment Variables - Tambahan Fase 1

`E2E_SISWA_EMAIL` / `E2E_SISWA_PASSWORD` / `E2E_STAFF_EMAIL` / `E2E_STAFF_PASSWORD` - opsional, hanya untuk `e2e/admin-rbac.spec.ts` (uji RBAC 403 dan submit form admin). Wajib memakai akun uji khusus, jangan pernah kredensial produksi.

## Fase 2 - Direktori Siswa & Galeri

Migration tambahan:

- `0004_direktori_galeri_schema.sql` - kolom baru `profiles` (slug, citaCita, socialLinks), tabel `gallery_albums`, `gallery_items`.
- `0005_direktori_galeri_rls.sql` - RLS untuk kedua tabel. **Siswa sengaja tidak memiliki hak `UPDATE`** atas `gallery_items` miliknya sendiri (hanya `INSERT`+`SELECT`), diverifikasi via `e2e/rls-direct-api.spec.ts` yang mencoba PATCH langsung ke REST API Supabase.

**Arsitektur upload siswa** memakai pola server-proxied yang sama dengan Fase 1 (bukan direct-upload), dengan tambahan: rate limit 10 unggahan/pengguna/24 jam, folder Cloudinary per album (`galeri/{albumSlug}/`), validasi slug ketat mencegah path traversal.

**Video**: hanya via tautan YouTube, diverifikasi lewat endpoint oEmbed resmi (`lib/youtube/oembed.ts`) sebelum disimpan - bukan unggah berkas video. Facade lazy-load: thumbnail dulu, iframe `youtube-nocookie.com` baru dimuat saat diklik. CSP `frame-src`/`img-src` diperluas untuk domain YouTube - tanpa ini embed akan diblokir browser.

**Catatan arsitektur penting**: `lib/actions/galeri.ts` (fungsi baca, server-only biasa) dan `lib/actions/galeri-mutations.ts` (`"use server"` di level file, dipanggil dari Client Component) sengaja dipisah. Menyatukan keduanya dalam satu berkas sempat menyeret driver `postgres` (dan modul Node.js seperti `net`/`tls`) ke bundle client saat diverifikasi lewat `next build` - kesalahan nyata yang ditemukan dan diperbaiki selama eksekusi.

`generateStaticParams` (`/direktori/[slug]`) dan `sitemap.ts` dibuat *fail-safe*: bila database tidak terjangkau saat build, keduanya melanjutkan dengan data kosong (bukan meruntuhkan build) - relevan untuk CI/CD produksi, bukan cuma sandbox pengembangan.

`E2E_PRIVATE_STUDENT_NAME`, `E2E_TEST_IMAGE_PATH` - variabel tambahan untuk `e2e/lightbox.spec.ts` dan `e2e/upload-moderation.spec.ts`.

## Fase 3 - Jadwal, Agenda, dan Akademik (+ Kas Digital)

Migration tambahan:

- `0006_fase3_akademik_schema.sql` - kolom `category` aditif ke `academic_events`; tabel baru `subjects`, `class_schedule`, `piket_schedule`, `piket_assignments`, `grades`, `attendance`, `announcements`, `assignments`, `assignment_submissions`, dan `kas_settings` (di luar cakupan brief Fase 3, lihat di bawah).
- `0007_fase3_akademik_rls.sql` - RLS seluruh tabel di atas. **`pengurus` dikecualikan total** dari `grades`/`attendance` (tidak disertakan di satu pun kebijakan), diverifikasi lewat `e2e/akademik-rbac.spec.ts` (level UI) dan `e2e/rls-direct-api.spec.ts` (level REST API langsung).
- `0008_kas_digital_rls.sql` - RLS `kas_settings`, dipisah dari `0007` agar kebijakan akses kas dapat diaudit terpisah dari inti akademik meski skemanya tergenerate dalam satu berkas yang sama.

**Seed data**: `subjects` (mata pelajaran) tidak memiliki data awal - isi manual lewat SQL Editor Supabase atau tambahkan ke `drizzle/seed.ts` sebelum mengetes `/dashboard/nilai`, karena `BulkGradeEntryTable` butuh minimal satu mata pelajaran terdaftar.

**Dua penyimpangan sengaja dari skema mentah di prompt**, dengan alasan eksplisit:
1. `attendance.date` memakai tipe `DATE` Postgres murni (Drizzle `date()`, bukan `timestamp(withTimezone:true)`). Dengan timestamptz, `UNIQUE(studentId, date)` yang diwajibkan brief tidak efektif mencegah duplikat karena dua entri "hari yang sama" bisa punya jam:menit berbeda. `DATE` membuat constraint ini benar secara struktural.
2. `grades.score` diberi `CHECK (score BETWEEN 0 AND 100)` - satu-satunya CHECK constraint di seluruh skema (proyek ini sejak Fase 0 mengandalkan validasi Zod saja). Pengecualian sengaja untuk tabel akademik paling sensitif: RLS membatasi *siapa* menulis, bukan *nilai apa* yang ditulis.

**Pola pemisahan berkas baca vs mutasi** (pelajaran bug Fase 2 diterapkan proaktif, bukan ditemukan lewat build gagal lagi): setiap domain akademik punya dua berkas - `jadwal.ts`/`akademik.ts`/`admin-akademik.ts` (`server-only`, dipanggil Server Component) terpisah dari `admin-jadwal.ts`/`akademik-mutations.ts`/`admin-akademik-mutations.ts` (`"use server"` murni di level file, aman diimpor Client Component). `jadwal-client.ts` dan `admin-akademik-client.ts` adalah jembatan tipis `"use server"` khusus untuk kebutuhan client memuat data baca on-demand (navigasi bulan kalender, lembar entry massal) tanpa mengimpor modul `server-only` secara langsung.

**Audit log per-baris**: `bulkUpsertGrades`/`bulkUpsertAttendance` menulis satu bulk `INSERT ... ON CONFLICT DO UPDATE` (Postgres menerapkan `EXCLUDED` per-baris secara otomatis) lalu satu bulk insert ke `audit_log` - efisien (3 query, bukan ratusan), tapi tetap menghasilkan satu baris audit independen per siswa per Bagian 9 brief, bisa ditelusuri individual dari `/dashboard/audit-log` (**super_admin saja**, wali_kelas dikecualikan juga di halaman ini secara sengaja).

### Kas Digital

Fitur tambahan **di luar cakupan prompt Fase 3**, dieksekusi pada rilis yang sama atas permintaan eksplisit. Murni tampilan: kode QRIS (gambar diunggah staf, validasi magic bytes server-side identik pola Fase 1) dan nomor e-wallet DANA untuk siswa scan/transfer manual. **Tidak ada integrasi payment gateway, tidak ada pencatatan atau rekonsiliasi transaksi otomatis** - portal hanya menampilkan tujuan pembayaran. Baca: seluruh role login (`/kas`). Kelola: `super_admin`/`wali_kelas` saja (`/dashboard/kas`), mengikuti pola staf-dua-role Fase 3, bukan pola pengurus-inklusif moderasi galeri Fase 2.

## Environment Variables - Tambahan Fase 3

`E2E_PENGURUS_EMAIL` / `E2E_PENGURUS_PASSWORD` - akun uji role `pengurus`, wajib untuk pengujian negatif `e2e/akademik-rbac.spec.ts` dan `e2e/rls-direct-api.spec.ts` (penolakan akses nilai/absensi). Belum ada di Fase 0-2 karena belum ada kebutuhan mengecualikan role ini dari modul apa pun sebelum Fase 3.

## Revisi Fase 1 - Anggota Kelas di Beranda

Section baru "Anggota Kelas" disisipkan di `app/(public)/page.tsx`, antara Statistik Ringkas dan Sorotan Kegiatan. Memakai ulang `getStudentList()` dari `lib/actions/direktori.ts` sepenuhnya - **tidak ada tabel atau Server Action baru**, sesuai Asumsi Kunci #1 revisi. `ClassMemberCard` (`components/shared/class-member-card.tsx`) baru: thumbnail Cloudinary 150×150 `loading="lazy"` (bukan `priority` - Hero tetap satu-satunya elemen LCP prioritas), `whileInView` independen per kartu (bukan satu stagger container untuk seluruh grid, per spesifikasi eksplisit revisi). `getInitials` diekstrak dari `student-card.tsx` ke `lib/utils.ts` agar dipakai ulang tanpa duplikasi.

## Fase 4 - Prestasi, Portofolio, dan Blog

Migration tambahan:

- `0009_fase4_prestasi_portofolio_blog_schema.sql` - tabel `achievements`, `achievement_participants`, `portfolio_projects`, `portfolio_contributors`, `alumni_testimonials`, `blog_categories`, `blog_posts`, `blog_comments`. Murni aditif.
- `0010_fase4_prestasi_portofolio_blog_rls.sql` - RLS seluruh tabel di atas. **Tiga celah brief ditutup** (pola sama seperti `subjects` di Fase 3): `blog_categories` dan `portfolio_contributors` sama sekali tidak disebut di blok RLS prompt; `blog_comments` hanya diberi policy SELECT/INSERT/DELETE padahal `hideComment()` butuh UPDATE (mengubah `is_hidden`) yang tanpa policy tambahan akan selalu gagal walau dipanggil staf sah.

**Keputusan arsitektur kunci:**
- Staf di Fase 4 **selalu mencakup `pengurus`** pada seluruh mutasi (`role in ('super_admin','wali_kelas','pengurus')`) - berbeda dari pola nilai/absensi Fase 3 yang mengecualikannya. Prestasi/portofolio/blog bersifat konten-dimoderasi (sejenis galeri Fase 2), bukan data administratif sensitif.
- `contentMarkdown` **tidak** dilewatkan `sanitizeUserText` saat disimpan - disimpan mentah apa adanya. Sanitasi XSS terjadi seluruhnya di **render time** lewat `MarkdownRenderer` (`react-markdown` + `remark-gfm` + `rehype-sanitize`, schema default `hast-util-sanitize`), satu-satunya titik konfigurasi dipakai identik oleh tampilan publik dan pratinjau editor (Bagian 10 brief).
- `submitPostForReview` menentukan status akhir (`pending_review` vs `published`) **seluruhnya dari role sesi server** - tidak menerima parameter status dari client sama sekali. RLS `posts_update_own_draft_or_staff` menjadi lapis kedua: tanpa `WITH CHECK` eksplisit, Postgres memakai ekspresi `USING` yang sama untuk baris baru, sehingga percobaan PATCH langsung `status=published` oleh siswa ditolak database itu sendiri - diverifikasi eksplisit di `e2e/rls-direct-api.spec.ts`, bukan diasumsikan.
- `deleteOwnComment` (hard-delete) **hanya** untuk penulis komentar sendiri, bahkan staf ditolak eksplisit di situ - staf memakai `hideComment` (soft-delete `is_hidden`) yang terpisah, sesuai pemisahan wewenang Bagian 10 brief secara harfiah.
- Pola pemisahan berkas baca vs mutasi (`prestasi.ts`/`admin-prestasi-mutations.ts`, `blog.ts`/`blog-mutations.ts`/`admin-blog-mutations.ts`) diterapkan konsisten sejak Fase 3, plus tiga jembatan `"use server"` tipis (`jadwal-client.ts` diperluas prinsipnya ke `admin-akademik-client.ts` dan `blog-client.ts` baru) untuk kebutuhan client memuat data on-demand (kalender, lembar entry, "Muat Lebih Banyak" listing blog).
- `StatusBadge` **dipindah** dari `components/galeri/status-badge.tsx` ke `components/shared/status-badge.tsx` dan diperluas dari `ContentStatusSubset` (3 nilai) ke `ContentStatus` penuh (6 nilai, menambah `draft`/`published`) - `blog_posts` memakai siklus status lebih panjang daripada galeri/portofolio yang berhenti di `approved`.

**Pengujian sanitasi XSS** (Bagian 12 & 14 brief - dijalankan sungguhan, bukan ditulis lalu diasumsikan lulus): `components/shared/markdown-renderer.test.tsx` me-render `MarkdownRenderer` sesungguhnya lewat `@testing-library/react` + `jsdom` (sudah terpasang sejak Fase 0, dipakai pertama kali di sini) dengan payload `<script>`, `onerror=`, dan URI `javascript:` pada tautan/gambar Markdown murni - **6/6 lulus**, memeriksa DOM hasil render langsung, bukan menguji ulang implementasi `rehype-sanitize`.

Prasyarat sebelum Fase 6: migrasi `0011`-`0013` ke Supabase nyata (lihat catatan kritis migration `0013` di bagian Fase 5), buat minimal satu polling aktif dan isi `kelulusan_content` lewat `/dashboard/interaksi` dan `/dashboard/kelulusan` sebelum menguji alur penuh, siapkan dummy Turnstile key untuk E2E (lihat `.env.example`), jalankan `pnpm test:e2e` dan Lighthouse di lingkungan berbrowser.

## Fase 5: Interaksi & Corner Kelulusan

Migration tambahan:

- `0011_fase5_interaksi_kelulusan_schema.sql`: dihasilkan `drizzle-kit generate` (bukan ditulis tangan, berbeda dari migration schema fase-fase sebelumnya yang juga digenerate tapi tidak selalu ditulis eksplisit di sini): tabel `guestbook_entries`, `aspirations`, `polls`, `poll_options`, `poll_votes`, `pesan_kesan`, `kelulusan_content`; kolom `yearbookQuote`/`yearbookPhotoUrl` aditif ke `profiles`.
- `0012_fase5_interaksi_kelulusan_rls.sql`: RLS seluruh tabel di atas, fungsi `is_staff()` (SECURITY DEFINER, lihat catatan bug kritis di bawah), trigger `poll_votes_enforce_rules` (validasi polling terbuka/opsi valid/satu-pilihan-per-polling di level database, bukan hanya Server Action, dengan advisory lock per pemilih untuk menutup race TOCTOU), fungsi `get_poll_results()` (SECURITY DEFINER, agregat suara tanpa membuka baris mentah). **Satu-satunya policy INSERT `TO anon` di seluruh proyek** (`guestbook_insert_anyone`), diperketat dengan `WITH CHECK` eksplisit (status awal, panjang teks, larangan memalsukan `moderated_by`/`author_id`) melampaui draf prompt asli yang hanya `WITH CHECK (true)`. Tanpa pengetatan ini, pemanggil REST langsung berbekal kunci `anon` publik dapat menyetel `status='approved'` sendiri dan melewati pre-moderasi sepenuhnya. Pola sama diterapkan ke `aspirations`/`pesan_kesan` (larangan self-approve konten anonim). Kolom identitas pengirim (`author_id`, `from_student_id`) dicabut haknya dari SELECT langsung lewat `GRANT` per-kolom, murni presentasi tetap ditegakkan di Server Action seperti didesain, tapi sekarang juga tidak bisa dibaca lewat REST API langsung oleh sesama siswa.
- `0013_fix_profiles_rls_recursion.sql`: **perbaikan kritis, bukan fitur Fase 5**, ditemukan selama verifikasi RLS terhadap Postgres nyata (lihat di bawah).

### Temuan kritis: rekursi RLS pada `profiles` sejak Fase 0

`pnpm db:verify-rls` (dijalankan pertama kali di Fase 5, lihat bagian Keamanan) menemukan `profiles_select_own_or_public_or_staff` dan `profiles_update_own_or_staff` (`0001_rls_and_auth_trigger.sql`) memuat subquery `EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role IN (...))` **langsung pada policy tabel `profiles` itu sendiri**. Mengevaluasi policy ini memerlukan meng-query `profiles` lagi, yang memicu evaluasi policy yang sama lagi: rekursi tak hingga, gagal `SQLSTATE 42P17`. Diverifikasi lewat eksekusi langsung (PGlite/Postgres 18.3), bukan pembacaan kode: setiap query `authenticated` yang menyentuh subquery staf ini gagal; `anon` lolos hanya karena `auth.uid()` bernilai `NULL` sehingga predikat `p.id = NULL` dioptimasi planner menjadi `false` tanpa pernah menyentuh RLS `profiles`.

Karena **setiap** tabel di proyek ini sejak Fase 1 (achievements, blog\_\*, gallery\_\*, portfolio\_\*, grades, attendance, kas\_settings, dan seterusnya) memuat subquery staf yang sama ke `profiles`, dan evaluasinya selalu melewati policy `profiles` yang rekursif ini, bug ini secara efektif merusak **seluruh** RLS proyek untuk siapa pun yang login, sejak Fase 0, pada jalur mana pun yang benar-benar menghormati RLS (PostgREST/Supabase client langsung; jalur Server Action tetap berfungsi karena memakai koneksi `db` Drizzle service-level yang melewati RLS sepenuhnya, sesuai arsitektur Bagian 5 brief Fase 0, itulah sebabnya bug ini tidak pernah termanifestasi sebagai kegagalan fungsional yang terlihat). Migration `0013` memperbaikinya dengan fungsi `is_staff()` (SECURITY DEFINER, query di dalamnya berjalan dengan privilese pemilik fungsi sehingga tidak memicu ulang RLS `profiles`) menggantikan subquery inline pada kedua policy tersebut, plus `audit_log_select_staff_only`. Diverifikasi ulang: 64/64 skenario `pnpm db:verify-rls` lulus setelah `0013`, dibanding 20 gagal sebelumnya. Rekomendasi Fase 6: seragamkan seluruh policy staf lain (migration 0003-0010) ke `is_staff()` untuk performa (fungsi `STABLE` di-cache per statement, subquery inline berkorelasi per baris), meski tidak rekursif seperti `profiles`.

### Arsitektur & keputusan kunci

- **Penamaan berkas Server Action diselaraskan ke konvensi berkas ini**, bukan mengikuti kontrak §4 prompt Fase 5 secara harfiah (yang menggabungkan baca+mutasi dalam satu header berkas nominal untuk `interaksi.ts`/`kelulusan.ts`/`admin-interaksi.ts`, dan menamai mutasi profil `profil-saya.ts` alih-alih `*-mutations.ts`): dipecah menjadi `interaksi.ts`+`interaksi-mutations.ts`, `kelulusan.ts`+`kelulusan-mutations.ts`+`kelulusan-client.ts` (jembatan `fetchMorePesanKesan`, pola identik `blog-client.ts`), `profil-saya-mutations.ts`, `admin-interaksi.ts`+`admin-interaksi-mutations.ts`, `admin-kelulusan.ts`+`admin-kelulusan-mutations.ts`. Konsisten dengan pola wajib Bagian 6 brief di seluruh Fase 3-4; `admin-galeri.ts` (Fase 2) tetap satu-satunya berkas lama yang menyimpang dari pola ini (`"use server"` level-berkas mencampur baca+mutasi) dan sengaja tidak disentuh (di luar cakupan aditif Fase 5), direkomendasikan untuk Fase 6.
- **`approveX`/`rejectX` sebagai dua fungsi terpisah**, bukan satu `moderateX(id, decision)` seperti kontrak §4 prompt: menyamakan pola `approvePortfolio`/`rejectPortfolio` (Fase 4) yang sudah mapan di seluruh proyek. Tidak ada parameter `reason` untuk `rejectGuestbookEntry`/`rejectAspiration`/`rejectPesanKesan` (berbeda dari `rejectPortfolio`/`rejectPost` yang punya `rejectionReason`): konsisten dengan skema §3 prompt sendiri yang memang tidak memberi kolom itu ke ketiga tabel baru ini, bukan celah yang diam-diam ditutup.
- **`kelulusan_content` mengikuti pola `class_profile` (Fase 1), bukan pola moderasi konten**: hanya `super_admin`+`wali_kelas` yang boleh mengubah (`pengurus` dikecualikan), berbeda dari `guestbook`/`aspirations`/`pesan_kesan`/`polls` yang menyertakan `pengurus`. Ditegakkan identik di tiga lapis: RLS (`0012`), `requireStaffRole` pada `updateKelulusanContent`, dan halaman `/dashboard/kelulusan` menyembunyikan form (bukan menampilkannya lalu menolak saat submit) untuk peran `pengurus`.
- **Honeypot posisi-di-luar-layar** (`components/interaksi/guestbook-form.tsx`): `position:absolute; left:-9999px`, bukan `display:none`, dengan `aria-hidden="true"` pada wrapper agar pembaca layar tetap tidak pernah mengumumkannya. Diuji lewat render sungguhan (`guestbook-form.test.tsx`, `@testing-library/react`), bukan hanya dibaca kode: memverifikasi field bukan `type="hidden"` dan bukan `display:none`/`visibility:hidden`.
- **Turnstile dimuat dengan atribut `nonce`**, bukan menambah `challenges.cloudflare.com` ke `script-src`: CSP `proxy.ts` memakai `'strict-dynamic'`, dan skrip bernonce yang sudah dipercaya otomatis mewariskan kepercayaan ke resource yang dimuatnya secara dinamis, pola resmi yang direkomendasikan Cloudflare untuk CSP ber-`strict-dynamic` (diverifikasi ke dokumentasi resmi Cloudflare, bukan diasumsikan). `frame-src` tetap wajib ditambah karena `strict-dynamic` hanya berlaku untuk skrip, bukan iframe widget itu sendiri.
- **`submitVote` dibungkus transaksi** dengan pengecekan "sudah memilih?" di dalamnya, mempersempit jendela race TOCTOU; trigger database `poll_votes_enforce_rules` (`0012`) adalah penjaga akhir yang benar-benar tidak bisa dilewati (berlaku juga untuk panggilan REST langsung, bukan hanya Server Action), dengan advisory lock per (polling, pemilih). Diverifikasi lewat `pnpm db:verify-rls`, termasuk skenario bulk-insert dua opsi berbeda sekaligus pada polling single-choice (ditolak, tanpa baris parsial tersisa).
- **`getPollResults` memanggil RPC lewat klien Supabase**, bukan koneksi `db` Drizzle langsung, satu-satunya baca di Fase 5 yang sengaja tidak memakai `db`: tujuan `get_poll_results()` SECURITY DEFINER adalah agar pengguna biasa (termasuk `anon`) bisa mendapat agregat suara tanpa hak SELECT langsung ke `poll_votes`; memanggilnya lewat koneksi service-level akan meniadakan alasan RPC ini dibuat sama sekali.

### Environment Variables: Tambahan Fase 5

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`: wajib untuk buku tamu berfungsi sama sekali (tanpa keduanya, `TurnstileWidget` menampilkan pesan konfigurasi hilang di non-produksi, kosong di produksi). Untuk pengembangan lokal dan `e2e/interaksi.spec.ts`, pakai dummy key resmi Cloudflare yang selalu lolos (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`, lihat `.env.example`), jangan pernah di produksi. `E2E_SISWA2_EMAIL`/`E2E_SISWA2_PASSWORD`: akun siswa kedua, khusus `e2e/kelulusan.spec.ts` (pesan-kesan butuh dua siswa berbeda: pengirim dan penerima).

### Pengujian

Unit test baru (`pnpm test`, dijalankan sungguhan, 86/86 lulus termasuk 82 dari fase sebelumnya): `lib/utils/moderation.test.ts` (fungsi murni `resolveAnonymousContentStatus`, dipakai `submitAspiration` dan `submitPesanKesan` agar kedua tabel tidak bisa diam-diam menyimpang), `components/interaksi/guestbook-form.test.tsx` (render sungguhan, verifikasi honeypot). `pnpm db:verify-rls` (baru, lihat catatan bug kritis di atas) adalah pengujian paling signifikan di fase ini: 64 skenario RLS/integritas data pada Postgres nyata, mencakup seluruh tabel baru plus regresi pada `profiles`/`audit_log`.

`e2e/interaksi.spec.ts` dan `e2e/kelulusan.spec.ts` (ditulis lengkap, tervalidasi struktur lewat `pnpm exec playwright test --list`, **belum dieksekusi live** seperti seluruh E2E proyek ini sejak Fase 0, lihat bagian Keamanan) mencakup seluruh skenario Definition of Done prompt: kirim buku tamu anonim (jalur sukses dan honeypot-tertolak-diam-diam), aspirasi anonim vs non-anonim (status awal berbeda), satu suara per polling (termasuk setelah reload halaman, memverifikasi penegakan server bukan hanya state client), dan pesan-kesan (penerima melihat sebelum disetujui, publik belum, kirim ulang menimpa bukan menumpuk).

**Lighthouse belum terukur** di sandbox ini (tidak ada Chromium, sama seperti seluruh fase sebelumnya) untuk delapan halaman baru (`/interaksi/buku-tamu`, `/interaksi/polling`, `/interaksi/aspirasi`, `/kelulusan`, `/kelulusan/tulis-pesan`, `/profil-saya`, `/dashboard/interaksi`, `/dashboard/kelulusan`): wajib dijalankan sebelum mengklaim target Bagian 11 prompt (LCP<2.5d, INP<200ms, CLS<0.1, Performance/Accessibility/Best Practices/SEO>90) benar-benar tercapai.

## Skrip

| Skrip | Fungsi |
|---|---|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` / `pnpm start` | Build & jalankan produksi |
| `pnpm lint` / `pnpm lint:fix` | Biome check |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unit) |
| `pnpm test:e2e` | Playwright (E2E - perlu `pnpm exec playwright install`) |
| `pnpm db:generate` / `db:migrate` / `db:studio` / `db:seed` | Drizzle Kit |
| `pnpm db:verify-rls` | Verifikasi RLS terhadap Postgres nyata (PGlite, tanpa kredensial), Fase 5 |
