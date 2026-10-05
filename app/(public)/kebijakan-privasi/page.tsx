import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Kebijakan Privasi | ${siteConfig.className} ${siteConfig.schoolName}`,
  description: `Kebijakan privasi dan tata kelola perlindungan data pribadi peserta didik Portal Digital ${siteConfig.className} ${siteConfig.schoolName}.`,
  alternates: { canonical: "/kebijakan-privasi" },
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="container-portal py-16 sm:py-20">
      <article className="mx-auto max-w-3xl space-y-12">
        <header className="space-y-4">
          <p data-eyebrow>Tata Kelola Informasi</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl text-foreground">
            Kebijakan Privasi dan Perlindungan Data
          </h1>
          <p className="text-base text-muted leading-relaxed">
            Portal Digital {siteConfig.className} {siteConfig.schoolName} berkomitmen melindungi
            keamanan data pribadi seluruh peserta didik, tenaga pendidik, dan pengunjung. Kebijakan
            ini disusun dengan merujuk pada ketentuan Undang-Undang Nomor 27 Tahun 2022 tentang
            Pelindungan Data Pribadi (UU PDP), khususnya perlindungan data peserta didik di bawah
            umur.
          </p>
          <p className="text-xs text-muted">
            Pembaruan terakhir: Oktober 2026. Berlaku efektif untuk seluruh pengguna portal.
          </p>
        </header>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            1. Data Pribadi yang Dikumpulkan
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Sistem mengumpulkan dan mengelola data dalam batasan operasional kelas dan rekam
            belajar:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted leading-relaxed">
            <li>
              <strong className="text-foreground">Identitas Pokok Siswa:</strong> Nama lengkap,
              Nomor Induk Siswa (NIS), alamat email resmi akun sekolah, dan foto profil.
            </li>
            <li>
              <strong className="text-foreground">Data Akademik:</strong> Rekap nilai mata
              pelajaran, kehadiran (absensi), jadwal piket, dan berkas tugas yang diunggah.
            </li>
            <li>
              <strong className="text-foreground">Karya dan Kontribusi:</strong> Proyek portofolio,
              prestasi kompetisi, artikel blog, dan foto kegiatan kelas.
            </li>
            <li>
              <strong className="text-foreground">Interaksi Digital:</strong> Pesan buku tamu,
              pilihan suara polling (agregat), aspirasi kelas, dan pesan-kesan kelulusan.
            </li>
            <li>
              <strong className="text-foreground">Log Keamanan dan Teknis:</strong> Alamat IP,
              user-agent browser (disanitasi), riwayat login, serta jejak audit perubahan data
              penting oleh staf pengelola.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            2. Matriks Akses dan Visibilitas Data
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Prinsip pemisahan hak akses (Row Level Security dan RBAC) membatasi akses data secara
            ketat di tingkat database:
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/20 font-medium text-foreground">
                <tr>
                  <th className="p-3">Kategori Data</th>
                  <th className="p-3">Publik / Anonim</th>
                  <th className="p-3">Siswa Pemilik</th>
                  <th className="p-3">Wali Kelas & Staf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                <tr>
                  <td className="p-3 font-medium text-foreground">Profil Siswa Publik</td>
                  <td className="p-3">Hanya jika is_public aktif</td>
                  <td className="p-3">Lihat dan Sunting</td>
                  <td className="p-3">Penuh (Kelola)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-foreground">Nilai dan Absensi</td>
                  <td className="p-3">Tertutup (Tidak ada akses)</td>
                  <td className="p-3">Hanya nilai milik sendiri</td>
                  <td className="p-3">Penuh (Evaluasi dan input)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-foreground">Pengumpulan Tugas</td>
                  <td className="p-3">Tertutup (Tidak ada akses)</td>
                  <td className="p-3">Kirim dan lihat milik sendiri</td>
                  <td className="p-3">Periksa dan beri nilai</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-foreground">Buku Tamu Publik</td>
                  <td className="p-3">Hanya entri yang disetujui</td>
                  <td className="p-3">Kirim dan lihat yang disetujui</td>
                  <td className="p-3">Moderasi dan hapus</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-foreground">Log Audit Sistem</td>
                  <td className="p-3">Tertutup</td>
                  <td className="p-3">Tertutup</td>
                  <td className="p-3">Super Admin saja</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            3. Hak Subjek Data (Peserta Didik)
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Setiap peserta didik memegang kendali atas data pribadinya:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted leading-relaxed">
            <li>
              <strong className="text-foreground">Kendali Visibilitas Profil:</strong> Siswa berhak
              menonaktifkan tampilan profil publik melalui pengaturan akun (toggle visibilitas
              profil). Jika dinonaktifkan, nama dan biodata tidak akan muncul di direktori publik.
            </li>
            <li>
              <strong className="text-foreground">Hak Koreksi Data:</strong> Siswa berhak mengajukan
              perbaikan apabila terdapat ketidaksesuaian data identitas, nilai, atau absensi kepada
              wali kelas.
            </li>
            <li>
              <strong className="text-foreground">Hak Penghapusan Akun Pasca Kelulusan:</strong>{" "}
              Siswa yang telah menyelesaikan masa studi berhak meminta penonaktifan akun serta
              pembersihan arsip portofolio personal dari server publik.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            4. Keamanan dan Perlindungan Teknis
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Data dilindungi melalui langkah keamanan berlapis:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted leading-relaxed">
            <li>
              Koneksi terenkripsi HTTPS (TLS modern) dengan HTTP Strict Transport Security (HSTS).
            </li>
            <li>
              Isolasi basis data menggunakan PostgreSQL Row Level Security (RLS) pada seluruh tabel.
            </li>
            <li>
              Pencegahan injeksi kode (XSS) melalui sanitasi HTML ketat pada input bebas Markdown
              dan komentar.
            </li>
            <li>
              Pembatasan frekuensi pengiriman (rate limiting) pada seluruh formulir publik dan
              autentikasi untuk mencegah serangan brute force dan bot spam.
            </li>
            <li>
              Sistem pemantauan error server yang secara otomatis menyaring (scrub) data nilai,
              identitas sensitif, dan pesan pribadi sebelum pencatatan log.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            5. Kontak Penanggung Jawab dan Pengaduan
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Untuk pertanyaan seputar tata kelola privasi, permohonan koreksi nilai, atau permintaan
            penghapusan data, silakan hubungi penanggung jawab resmi berikut (bukan kontak personal
            siswa):
          </p>
          <div className="rounded-lg border border-border bg-surface p-4 text-sm space-y-2">
            <p>
              <strong className="text-foreground">Wali Kelas XII RPL 3:</strong> Tim Pembina Kelas
              SMKN 1 Sukoharjo
            </p>
            <p>
              <strong className="text-foreground">Institusi:</strong> SMK Negeri 1 Sukoharjo,
              Kabupaten Sukoharjo, Jawa Tengah
            </p>
            <p>
              <strong className="text-foreground">Surel Pengaduan Data:</strong> Kontak resmi
              melalui pihak tata usaha sekolah atau wali kelas terkait.
            </p>
          </div>
        </section>

        <footer className="border-t border-border pt-8 flex items-center justify-between text-sm">
          <Link href="/" className="text-accent-text hover:underline underline-offset-4">
            ← Kembali ke Beranda
          </Link>
          <Link href="/profil" className="text-muted hover:text-foreground">
            Lihat Profil Kelas →
          </Link>
        </footer>
      </article>
    </div>
  );
}
