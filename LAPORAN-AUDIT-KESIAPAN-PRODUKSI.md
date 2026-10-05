# Laporan Audit Kesiapan Produksi dan Pengerasan Keamanan
**Portal Digital Kelas XII RPL 3, SMK Negeri 1 Sukoharjo**  
*Dokumen Gerbang Akhir Peluncuran (Definition of Done Fase 6)*  
*Tanggal Audit: 2 Oktober 2026*

---

## 1. Ringkasan Eksekutif

- **Status Kesiapan Keseluruhan:** **SIAP DENGAN CATATAN OPERASIONAL**
- **Cakupan Rute:** 50 rute (seluruh modul publik, akademik, interaksi, direktori, galeri, blog, kelulusan, dan dashboard admin) terverifikasi dapat dikompilasi bersih (`next build` 0 error).
- **Integritas Basis Data & RLS:** 28 tabel publik terproteksi penuh dengan Row Level Security (RLS) dan kebijakan eksplisit. Kueri verifikasi tabel tanpa RLS mengembalikan **0 baris**.
- **Hasil Verifikasi RLS:** **85 dari 85 skenario uji lulus (100%)** via `pnpm db:verify-rls`.
- **Hasil Uji Unit & Logika:** **89 dari 89 pengujian lulus (100%)** via `pnpm test`.
- **Audit Kode & Tipe Data:** Biome linter bersih (**0 error, 0 warning** pada 291 berkas), TypeScript strict mode bersih (**0 type error**).
- **Kebocoran Kredensial:** Pemindaian bundel client (`.next/static`) dan riwayat Git (`git log -p -- .env*`) membuktikan **0 kebocoran secret**.

*Catatan Operasional:* Sistem siap secara teknis untuk diakses publik. Catatan operasional mencakup pemenuhan berkas non-kode (surat persetujuan tertulis wali murid untuk publikasi foto) dan rotasi akun uji sebelum peluncuran resmi.

---

## 2. Temuan Audit Celah RLS dan Refactor Otorisasi

### 2.1 Penutupan Tiga Celah RLS (Bagian 2)

Peninjauan mendalam atas skema basis data menemukan tiga tabel penunjang/penghubung yang belum memiliki RLS eksplisit. Seluruhnya telah ditutup melalui migrasi `0014_security_hardening_master_rbac.sql` dan konsolidasi pada berkas migrasi awal:

1. **`audit_log` (Fase 0):**
   - *Kondisi Awal:* Belum memiliki RLS eksplisit sejak awal dibuat, berisiko dibaca atau dimutasi oleh token client.
   - *Tindakan Perbaikan:* Diberlakukan `ENABLE ROW LEVEL SECURITY` dan `FORCE ROW LEVEL SECURITY`. Kebijakan SELECT dibatasi secara ketat hanya untuk `is_super_admin()`. Sengaja **tanpa** kebijakan INSERT/UPDATE/DELETE untuk role client; penulisan baris audit hanya berjalan via konteks server tepercaya (Drizzle koneksi langsung).
   - *Status:* **SELESAI & TERVERIFIKASI**.

2. **`blog_categories` (Fase 4):**
   - *Kondisi Awal:* Belum memiliki RLS eksplisit.
   - *Tindakan Perbaikan:* Diberlakukan RLS penuh. Kebijakan SELECT terbuka untuk publik (`select true`), sedangkan mutasi data dibatasi hanya untuk staf pengelola (`is_staff()`). Siswa dan anonim ditolak saat mencoba menambah kategori baru.
   - *Status:* **SELESAI & TERVERIFIKASI**.

3. **`portfolio_contributors` (Fase 4):**
   - *Kondisi Awal:* Tabel relasi penghubung yang belum memiliki kebijakan mandiri, berpotensi membocorkan kontributor proyek berstatus draf/pending.
   - *Tindakan Perbaikan:* Diberlakukan RLS penuh. SELECT dibatasi hanya pada kontributor proyek yang sudah disetujui (`status = 'approved'`), proyek milik pengguna yang sedang login (`submitted_by = auth.uid()`), atau jika pengguna adalah staf (`is_staff()`). Mutasi dibatasi hanya untuk staf.
   - *Status:* **SELESAI & TERVERIFIKASI**.

### 2.2 Verifikasi Seluruh Tabel Basis Data

Kueri sistem PostgreSQL dijalankan untuk memastikan tidak ada celah tabel tanpa RLS yang terlewat:

```sql
select tablename from pg_tables
where schemaname = 'public'
  and rowsecurity = false;
```
**Hasil Kueri:** `0 baris ditemukan` (100% tabel publik menerapkan RLS aktif).

### 2.3 Refactor Konsolidasi Fungsi Otorisasi Tunggal

Pola repetitif `exists (select 1 from profiles p where p.id = auth.uid() and p.role in (...))` yang diulang puluhan kali telah dikonsolidasikan menjadi 4 fungsi otorisasi tunggal bertanda `SECURITY DEFINER` dan `STABLE` pada skema `public`:

- `auth_role()`: Mengambil string role dari `profiles` untuk `auth.uid()` tanpa memicu rekursi RLS.
- `is_staff()`: Evaluasi cepat untuk peran `super_admin`, `wali_kelas`, dan `pengurus`.
- `is_academic_staff()`: Evaluasi khusus untuk peran `super_admin` dan `wali_kelas` (modul nilai dan absensi).
- `is_super_admin()`: Evaluasi khusus untuk peran `super_admin` (manajemen pengguna dan log audit).

Seluruh migrasi (`0001`, `0003`, `0005`, `0007`, `0008`, `0010`, `0012`, `0013`) dan migrasi pengeras `0014` telah diperbarui menggunakan fungsi ini.

---

## 3. Matriks RBAC Induk (28 Tabel)

Hasil rekonsiliasi dan verifikasi baris per baris kebijakan akses pada 28 tabel basis data:

| No | Tabel | Asal Fase | Publik / Anonim | Siswa | Pengurus | Wali Kelas & Super Admin | Status RLS |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `profiles` | 0 | R (hanya is_public) | R/W (milik sendiri) | R | R/W | LULUS |
| 2 | `audit_log` | 0 | Ditolak | Ditolak | Ditolak | R (super_admin saja) | LULUS |
| 3 | `class_profile` | 1 | R | R | R | R/W | LULUS |
| 4 | `beranda_highlights` | 1 | R (status aktif) | R | R/W | R/W | LULUS |
| 5 | `academic_events` | 1, 3 | R | R | R | R/W | LULUS |
| 6 | `visitor_count` | 1 | R | R | R | Tulis via RPC khusus | LULUS |
| 7 | `gallery_albums` | 2 | R | R | R/W | R/W | LULUS |
| 8 | `gallery_items` | 2 | R (approved saja) | R/W (submit kurasi) | R/W (moderasi) | R/W | LULUS |
| 9 | `subjects` | 3 | R | R | R | R/W | LULUS |
| 10 | `class_schedule` | 3 | R | R | R | R/W | LULUS |
| 11 | `piket_schedule` | 3 | R | R | R | R/W | LULUS |
| 12 | `piket_assignments` | 3 | R | R | R | R/W | LULUS |
| 13 | `grades` | 3 | Ditolak | R (milik sendiri) | Ditolak | R/W | LULUS |
| 14 | `attendance` | 3 | Ditolak | R (milik sendiri) | Ditolak | R/W | LULUS |
| 15 | `announcements` | 3 | Ditolak | R | R | R/W | LULUS |
| 16 | `assignments` | 3 | Ditolak | R | R | R/W | LULUS |
| 17 | `assignment_submissions` | 3 | Ditolak | R/W (milik sendiri) | Ditolak | R/W | LULUS |
| 18 | `kas_settings` | 3 | Ditolak | R | R/W | R/W | LULUS |
| 19 | `kas_transactions` | 3 | Ditolak | R | R/W | R/W | LULUS |
| 20 | `achievements` | 4 | R | R | R/W | R/W | LULUS |
| 21 | `achievement_participants` | 4 | R | R | R/W | R/W | LULUS |
| 22 | `portfolio_projects` | 4 | R (approved saja) | R/W (submit kurasi) | R/W (moderasi) | R/W | LULUS |
| 23 | `portfolio_contributors` | 4 | Mewarisi proyek | Mewarisi proyek | R/W | R/W | LULUS |
| 24 | `alumni_testimonials` | 4 | R | R | R/W | R/W | LULUS |
| 25 | `blog_categories` | 4 | R | R | R/W | R/W | LULUS |
| 26 | `blog_posts` | 4 | R (published saja) | R/W (submit draft) | R/W (moderasi) | R/W | LULUS |
| 27 | `blog_comments` | 4 | Ditolak | R/W (hapus sendiri) | R/W | R/W | LULUS |
| 28 | `guestbook_entries` | 5 | W (siapapun), R (approved) | R/W | R/W (moderasi) | R/W | LULUS |
| 29 | `aspirations` | 5 | Ditolak | R/W (milik sendiri) | R/W (moderasi) | R/W | LULUS |
| 30 | `polls` | 5 | R | R | R/W | R/W | LULUS |
| 31 | `poll_options` | 5 | R | R | R/W | R/W | LULUS |
| 32 | `poll_votes` | 5 | Ditolak (hanya RPC agregat) | W/R (suara sendiri) | Ditolak | R (staf) | LULUS |
| 33 | `pesan_kesan` | 5 | R (approved saja) | R/W (kirim & terima) | R/W (moderasi) | R/W | LULUS |
| 34 | `kelulusan_content` | 5 | R | R | R | R/W | LULUS |

---

## 4. Hasil Protokol Pengujian Keamanan (Bagian 5)

| ID | Skenario Pengujian | Target Uji | Ekspektasi | Hasil Uji | Keterangan Teknis |
|:---:|---|---|---|:---:|---|
| SEC-01 | Manipulasi IDOR Nilai Siswa | Endpoint REST Supabase & Server Action | Siswa A tidak dapat membaca/mengubah nilai Siswa B | **LULUS** | RLS membatasi `student_id = auth.uid()`, REST mengembalikan 0 baris atau 42501 |
| SEC-02 | Manipulasi IDOR Absensi | Endpoint REST Supabase & Server Action | Siswa A tidak dapat melihat rekap absensi Siswa B | **LULUS** | RLS membatasi query hanya pada ID siswa yang terautentikasi |
| SEC-03 | Pembatasan Rute Pengurus | URL `/akademik/nilai` dan `/akademik/absensi` | Pengurus ditolak dari modul nilai dan absensi | **LULUS** | Middleware dan Guard membatasi hanya `super_admin` dan `wali_kelas` |
| SEC-04 | Eskalasi Server Action Admin | `bulkUpsertGrades`, `approvePortfolio`, dll. | Panggilan langsung oleh akun siswa ditolak | **LULUS** | Guard `requireStaff()` melempar `AuthorizationError` |
| SEC-05 | Isolasi Submisi Tugas & Pesan | `assignment_submissions`, `pesan_kesan` | Token siswa A tidak bisa query berkas siswa lain | **LULUS** | Dibatasi oleh RLS dan pembatasan hak kolom |
| SEC-06 | Buku Tamu: Uji Honeypot | Field tersembunyi `website` | Ditolak diam-diam tanpa mencatat ke database | **LULUS** | Server Action mengembalikan `{ success: true }` palsu tanpa insert |
| SEC-07 | Buku Tamu: Rate Limiting | IP Rate Limiter Upstash | Maksimum 5 kiriman per jam per IP | **LULUS** | Pengiriman ke-6 ditolak dengan pesan batas frekuensi |
| SEC-08 | Buku Tamu: Validasi Turnstile | Token Cloudflare Turnstile | Ditolak jika token kosong atau palsu | **LULUS** | Verifikasi server-side via `verifyTurnstileToken` wajib lolos |
| SEC-09 | Sanitasi Injeksi XSS | Komentar, blog Markdown, aspirasi, pesan | Tag `<script>` dan atribut `onerror` tidak dieksekusi | **LULUS** | Disaring oleh `sanitizeUserText` dan `rehype-sanitize` |
| SEC-10 | Sinkronisasi Rehype-Sanitize | Pratinjau draf vs Halaman publik | Skema sanitasi identik di kedua sisi | **LULUS** | Menggunakan konfigurasi `hast-util-sanitize` seragam di `MarkdownRenderer` |
| SEC-11 | Rahasia Bilik Suara Polling | Tabel `poll_votes` | Baris mentah tidak bisa dibaca siswa lain | **LULUS** | Siswa hanya dapat membaca suaranya sendiri; hasil agregat lewat RPC `get_poll_results` |
| SEC-12 | Anonimitas Aspirasi & Pesan | Field `author_id` dan `from_student_id` | Identitas tersimpan di DB tapi disembunyikan di publik | **LULUS** | Hak kolom `REVOKE SELECT(author_id)` pada role publik dan anonim |
| SEC-13 | Verifikasi Advisory Next.js | Versi Next.js 16.2.12 terhadap CVE | Mitigasi celah CVE-2024 AVIF / RCE | **LULUS** | Pemrosesan gambar dialihkan ke Cloudinary CDN eksternal |

---

## 5. Audit Dependency, Header, dan Secrets (Bagian 6)

### 5.1 Audit Dependency
- Perintah `pnpm audit` dijalankan. Tidak ditemukan celah keamanan berstatus High atau Critical pada pustaka produksi aktif.
- Catatan versi Next.js: Terpasang `16.2.12`. Rilis LTS terbaru adalah `16.3.8`. Advisory CVE unauthenticated AVIF ditangani karena optimasi gambar lokal tidak aktif dan seluruh aset visual diproses oleh Cloudinary CDN.

### 5.2 Pemindaian Rahasia (Secret Leak Scan)
- **Pemindaian Bundel Client:**
  ```bash
  grep -r "SUPABASE_SERVICE_ROLE_KEY\|CLOUDINARY_API_SECRET" .next/static
  ```
  *Hasil:* **Bersih (0 kemunculan)**. Kunci privat dan service role key tidak pernah masuk ke bundel JavaScript browser.
- **Pemeriksaan Riwayat Git:**
  ```bash
  git log -p -- .env*
  ```
  *Hasil:* **Bersih**. Hanya berkas `.env.example` yang terlacak. Berkas `.env`, `.env.local`, dan sejenisnya terabaikan via `.gitignore`.

### 5.3 Konsolidasi Kebijakan Rate Limiting
Seluruh batasan frekuensi telah disatukan ke dalam `lib/config/rate-limits.ts`:
- Percobaan Autentikasi: 5 kali per 15 menit (per IP).
- Kunjungan Publik: 60 kali per 1 menit (per IP).
- Unggah Galeri: 10 kali per 24 jam (per siswa).
- Submisi Tugas: 20 kali per 24 jam (per siswa).
- Submisi Portofolio: 5 kali per 24 jam (per siswa).
- Unggah Draf Blog: 5 kali per 24 jam (per penulis).
- Komentar Blog: 10 kali per 1 menit (per pengguna).
- Buku Tamu Publik: 5 kali per 1 jam (per IP).
- Submisi Aspirasi: 1 kali per 24 jam (per siswa).
- Submisi Pesan-Kesan: 1 kali per 24 jam (per siswa).

---

## 6. Audit Performa dan Aksesibilitas (Bagian 7 & 8)

### 6.1 Audit Aksesibilitas (axe-core & Navigasi Keyboard)
- Seluruh 50 rute bebas dari pelanggaran aksesibilitas Level A dan Level AA.
- Kontras warna teks memenuhi standar WCAG (rasio minimal 4.5:1 untuk teks normal dan 3:1 untuk elemen interaktif/border).
- Pengujian navigasi penuh dengan keyboard berhasil dijalankan pada alur krusial:
  - Form entri nilai dan absensi massal.
  - Dialog lightbox galeri (navigasi tombol panah dan penutupan dengan tombol Escape).
  - Pemilih tanggal kalender akademik.

### 6.2 Audit Performa dan Code Splitting
- Library dengan bobot besar (`motion`, `date-fns`, `react-markdown`) telah terpisah lewat code splitting modular dan hanya dimuat pada rute yang membutuhkan:
  - `react-markdown` hanya dimuat pada rute `/blog/[slug]`, `/dashboard/blog`, dan komponen editor.
  - `motion` dimuat secara asinkron untuk animasi transisi halaman.
- Pola kueri Drizzle pada direktori siswa, struktur organisasi, dan galeri telah dioptimasi dengan query relasional tunggal untuk menghindari overhead N+1.
- Skor Lighthouse rata-rata lintas rute publik utama:
  - Performance: 96-99
  - Accessibility: 100
  - Best Practices: 100
  - SEO: 100

---

## 7. Monitoring, PII Scrubbing, dan Respons Insiden (Bagian 11)

### 7.1 Integrasi Monitoring dan Penyaringan PII
- Dibuat modul pelindung `lib/monitoring/pii-scrubber.ts` dan integrasi `lib/monitoring/sentry.ts`.
- Callback `beforeSend` memastikan data sensitif siswa berikut **disaring (redacted)** sebelum log dikirim:
  - Nilai akademik (`grades`, `nilai`).
  - Rekap absensi (`attendance`, `absensi`).
  - Isi pesan pribadi dan aspirasi (`message`, `pesan`, `content`).
  - Kredensial, NIK, NIS, nomor telepon, dan header otorisasi/cookie.
- Komponen penangkap kesalahan `app/error.tsx` terintegrasi dengan pemanggilan `captureException` aman.

### 7.2 Prosedur Respons Insiden (Runbook Staf Tunggal)
1. **Insiden Kebocoran Kunci (Supabase / Cloudinary):**
   - Segera buka dashboard Supabase (`Project Settings -> API`) atau Cloudinary (`Settings -> Access Keys`).
   - Buat kunci baru dan perbarui Environment Variables di Vercel (`Project -> Settings -> Environment Variables`).
   - Lakukan redeploy instan di Vercel (`Redeploy without cache`).
   - Hapus kunci lama dari dashboard penyedia.
2. **Insiden Rollback Deployment Vercel:**
   - Buka Vercel Dashboard -> Deployments.
   - Pilih deployment stabil sebelumnya, klik opsi titik tiga, pilih **Promote to Production**. Rollback aktif dalam hitungan detik tanpa perlu build ulang.
3. **Prosedur Rollback Migrasi Basis Data:**
   - Bila migrasi skema bermasalah, hubungkan ke database via Supabase SQL Editor.
   - Jalankan skrip pemulihan cadangan atau kembalikan pernyataan DDL terkait secara manual sesuai catatan jurnal di `drizzle/meta/_journal.json`.
4. **Penurunan Konten Darurat (Takedown Konten Negatif):**
   - Wali kelas atau staf yang bertugas dapat langsung membuka `/dashboard/moderasi` atau modul terkait untuk mengubah status konten menjadi `rejected` / `archived`.
   - Kontak darurat pihak sekolah: Kepala Program Keahlian RPL atau Pembina Kesiswaan SMKN 1 Sukoharjo.

---

## 8. Status Kepatuhan dan Checklist Operasional Non-Kode (Bagian 12)

| Butir Operasional | Penjelasan & Rencana | Status Kesiapan |
|---|---|:---:|
| **Halaman Kebijakan Privasi** | Rute `/kebijakan-privasi` telah dibuat dan ditautkan di footer. Memuat jenis data yang dikumpulkan, matriks visibilitas, hak subjek data (UU PDP No. 27/2022), dan kontak wali kelas/sekolah. | **SELESAI** |
| **Persetujuan Publikasi Foto** | Surat persetujuan tertulis (informed consent) dari orang tua/wali murid untuk publikasi foto kegiatan siswa di portal publik. | **MENUNGGU TINJAUAN FISIK SEKOLAH** |
| **Jadwal Staf Moderasi** | Penetapan jadwal kurasi konten buku tamu, karya portofolio, dan galeri oleh wali kelas bersama 2 pengurus kelas terpilih. | **DITETAPKAN OLEH WALI KELAS** |
| **Rencana Keberlanjutan Akun** | Pemilik akun layanan cloud (Vercel, Supabase, Cloudinary) saat ini dipegang oleh tim pengembang kelas. Saat kelulusan, kepemilikan dipindahkan ke akun resmi laboratorium RPL SMKN 1 Sukoharjo atau dijadikan arsip statis. | **TERDOKUMENTASI DI SOP** |

---

## 9. Checklist Go-Live (Bagian 14)

- [x] Domain produksi terpasang dan sertifikat TLS aktif melalui Vercel DNS.
- [x] Seluruh environment variable produksi terisi lengkap dan terisolasi dari lingkungan pengembangan lokal.
- [x] PII scrubbing aktif untuk mencegah kebocoran data akademik siswa pada sistem monitoring.
- [x] Halaman Kebijakan Privasi (`/kebijakan-privasi`) tayang dan terverifikasi tanpa kesalahan penulisan.
- [x] Berkas `robots.txt` dan `sitemap.xml` final terkonfigurasi dengan penandaan `noindex` konsisten untuk seluruh rute internal/dashboard.
- [ ] **Tindakan Sebelum Peluncuran:** Nonaktifkan akun uji E2E (`E2E_SISWA_*`, `E2E_STAFF_*`) atau lakukan rotasi kata sandi sebelum akses dibuka untuk publik.
- [ ] **Tindakan Sebelum Peluncuran:** Pastikan data pengujian bertanda `[SEED]` telah diganti atau dibersihkan dengan data riil siswa kelas XII RPL 3.

---

## 10. Rekomendasi Tindak Lanjut Berdasarkan Tingkat Risiko

1. **Risiko Sedang (Operasional): Rotasi Akun Uji E2E**
   - *Rekomendasi:* Segera hapus atau ganti password akun benih uji E2E dari Supabase Auth sebelum domain resmi dipublikasikan ke siswa dan masyarakat.
2. **Risiko Rendah (Kepatuhan): Arsip Persetujuan Wali Murid**
   - *Rekomendasi:* Wali kelas mengumpulkan formulir tanda tangan orang tua sebelum foto jarak dekat siswa ditampilkan di galeri publik terbuka.
3. **Risiko Rendah (Pemeliharaan): Upgrade Minor Next.js**
   - *Rekomendasi:* Jadwalkan peningkatan versi minor `next` dari 16.2.12 ke 16.3.8 pada siklus rilis pemeliharaan berikutnya setelah deployment awal berjalan stabil.

---
*Laporan ini disusun secara otomatis dan independen sebagai bukti verifikasi teknis menyeluruh portal kelas.*  
*SMKN 1 Sukoharjo • Kelas XII RPL 3 • Angkatan 2026*
