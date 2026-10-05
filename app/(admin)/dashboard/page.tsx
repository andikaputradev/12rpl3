import { count, eq, gte, inArray } from "drizzle-orm";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Clock,
  ExternalLink,
  GraduationCap,
  History,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  QrCode,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";
import { db } from "@/lib/db";
import {
  academicEvents,
  aspirations,
  blogPosts,
  classProfile,
  galleryItems,
  guestbookEntries,
  kasSettings,
  pesanKesan,
  profiles,
} from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role, jabatan, full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle<{ role: string; jabatan?: string | null; full_name?: string }>();

  const [
    studentCountRes,
    staffCountRes,
    pendingGalleryRes,
    pendingBlogRes,
    pendingGuestbookRes,
    pendingAspirationsRes,
    pendingPesanKesanRes,
    upcomingEventsRes,
    classProfileRes,
    kasSettingsRes,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(profiles)
      .where(inArray(profiles.role, ["siswa", "pengurus"])),
    db
      .select({ count: count() })
      .from(profiles)
      .where(inArray(profiles.role, ["super_admin", "wali_kelas"])),
    db
      .select({ count: count() })
      .from(galleryItems)
      .where(eq(galleryItems.status, "pending_review")),
    db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "pending_review")),
    db
      .select({ count: count() })
      .from(guestbookEntries)
      .where(eq(guestbookEntries.status, "pending_review")),
    db.select({ count: count() }).from(aspirations).where(eq(aspirations.status, "pending_review")),
    db.select({ count: count() }).from(pesanKesan).where(eq(pesanKesan.status, "pending_review")),
    db
      .select({ count: count() })
      .from(academicEvents)
      .where(gte(academicEvents.eventDate, new Date())),
    db.select().from(classProfile).where(eq(classProfile.id, 1)).limit(1),
    db.select().from(kasSettings).where(eq(kasSettings.id, 1)).limit(1),
  ]);

  const totalStudents = studentCountRes[0]?.count ?? 0;
  const totalStaff = staffCountRes[0]?.count ?? 0;
  const pendingGallery = pendingGalleryRes[0]?.count ?? 0;
  const pendingBlog = pendingBlogRes[0]?.count ?? 0;
  const pendingGuestbook = pendingGuestbookRes[0]?.count ?? 0;
  const pendingAspirations = pendingAspirationsRes[0]?.count ?? 0;
  const pendingPesanKesan = pendingPesanKesanRes[0]?.count ?? 0;
  const totalPendingModeration =
    pendingGallery + pendingBlog + pendingGuestbook + pendingAspirations + pendingPesanKesan;
  const upcomingEventsCount = upcomingEventsRes[0]?.count ?? 0;

  const currentClassProfile = classProfileRes[0] ?? null;
  const currentKas = kasSettingsRes[0] ?? null;

  const userRole = currentProfile?.role ?? "siswa";
  const jabatan = (currentProfile?.jabatan ?? "").toLowerCase();

  const isSuperAdmin = userRole === "super_admin";
  const isWaliKelas = userRole === "wali_kelas";
  const isPengurus = userRole === "pengurus";

  const isBendahara = isPengurus && jabatan.includes("bendahara");
  const isSekretaris = isPengurus && jabatan.includes("sekretaris");
  const isKetuaOrWakil = isPengurus && (jabatan.includes("ketua") || jabatan.includes("wakil"));

  // Akses per modul
  const canAccessUsers = isSuperAdmin;
  const canAccessAuditLog = isSuperAdmin;
  const canAccessNilai = isSuperAdmin || isWaliKelas;
  const canAccessProfil = isSuperAdmin || isWaliKelas;
  const canAccessAlumni = isSuperAdmin || isWaliKelas;

  const canAccessAbsensi = isSuperAdmin || isWaliKelas || isKetuaOrWakil || isSekretaris;
  const canAccessJadwal = isSuperAdmin || isWaliKelas || isKetuaOrWakil || isSekretaris;
  const canAccessTugas = isSuperAdmin || isWaliKelas || isKetuaOrWakil || isSekretaris;
  const canAccessPengumuman = true;
  const canAccessKas = isSuperAdmin || isWaliKelas || isKetuaOrWakil || isBendahara;

  const canAccessModerasi = isSuperAdmin || isWaliKelas || isKetuaOrWakil;
  const canAccessBlog = isSuperAdmin || isWaliKelas || isKetuaOrWakil;
  const canAccessInteraksi = isSuperAdmin || isWaliKelas || isKetuaOrWakil;
  const canAccessKelulusan = isSuperAdmin || isWaliKelas || isKetuaOrWakil;
  const canAccessPrestasi = isSuperAdmin || isWaliKelas || isKetuaOrWakil;
  const canAccessPortofolio = isSuperAdmin || isWaliKelas || isKetuaOrWakil;

  return (
    <div className="container-portal flex flex-col gap-10 py-10">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p data-eyebrow>Panel Kontrol</p>
            <Badge
              variant="outline"
              className="text-xs font-medium border-accent/40 text-accent-text"
            >
              {currentProfile?.jabatan ||
                (isSuperAdmin
                  ? "Super Admin"
                  : isWaliKelas
                    ? "Wali Kelas"
                    : isPengurus
                      ? "Pengurus"
                      : "Siswa")}
            </Badge>
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Selamat Datang, {currentProfile?.full_name ?? "Pengguna"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Panel manajemen portal digital {siteConfig.className}. Menu dan hak akses disesuaikan
            dengan peran Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/" target="_blank" className="flex items-center gap-1.5">
              <span>Buka Portal Publik</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Alert Moderasi jika ada kiriman menunggu dan role memiliki hak moderasi */}
      {canAccessModerasi && totalPendingModeration > 0 && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-accent/20 p-2 text-accent-text">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">
                Terdapat {totalPendingModeration} kiriman menunggu peninjauan Anda
              </h2>
              <p className="text-xs text-muted">
                {[
                  pendingGallery > 0 && `${pendingGallery} galeri`,
                  pendingBlog > 0 && `${pendingBlog} blog`,
                  pendingGuestbook > 0 && `${pendingGuestbook} buku tamu`,
                  pendingAspirations > 0 && `${pendingAspirations} aspirasi`,
                  pendingPesanKesan > 0 && `${pendingPesanKesan} pesan-kesan`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {pendingGallery > 0 && (
              <Button asChild size="sm">
                <Link href="/dashboard/moderasi">Tinjau Galeri</Link>
              </Button>
            )}
            {(pendingGuestbook > 0 || pendingAspirations > 0) && (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/interaksi">Tinjau Interaksi</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Ringkasan Statistik Riil */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Statistik Sistem
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Users className="size-3.5 text-muted" />
                <span>Siswa Terdaftar</span>
              </CardDescription>
              <CardTitle className="font-mono text-2xl font-bold">{totalStudents}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted">Total siswa kelas aktif</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <UserCheck className="size-3.5 text-muted" />
                <span>Staf & Pengurus</span>
              </CardDescription>
              <CardTitle className="font-mono text-2xl font-bold">{totalStaff}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted">Wali kelas & pengurus</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Clock className="size-3.5 text-muted" />
                <span>Menunggu Moderasi</span>
              </CardDescription>
              <CardTitle className="font-mono text-2xl font-bold text-accent-text">
                {totalPendingModeration}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted">Kiriman butuh tinjauan</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <CalendarDays className="size-3.5 text-muted" />
                <span>Agenda Mendatang</span>
              </CardDescription>
              <CardTitle className="font-mono text-2xl font-bold">{upcomingEventsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted">Jadwal & kegiatan kelas</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modul Akses Cepat */}
      <section className="flex flex-col gap-8">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Administrasi & Operasional
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Pengaturan umum, agenda harian, komunikasi siaran, dan tata kelola kas.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {canAccessProfil && (
              <Link
                href="/dashboard/profil"
                className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <Sparkles className="size-4.5" />
                  </div>
                  {currentClassProfile ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-success-text border-success/40"
                    >
                      Terkonfigurasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted">
                      Belum Diisi
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                  Profil Kelas & Visi Misi
                </h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                  Kelola narasi sejarah, visi, misi, motto, dan foto kelas.
                </p>
              </Link>
            )}

            {canAccessUsers && (
              <Link
                href="/dashboard/pengguna"
                className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <UserCog className="size-4.5" />
                  </div>
                  <span className="font-mono text-xs text-muted">
                    {totalStudents + totalStaff} akun
                  </span>
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                  Manajemen Pengguna (CRUD)
                </h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                  Tambah pengguna baru, kelola peran, NIS, nomor absen, dan hapus akun.
                </p>
              </Link>
            )}

            {canAccessJadwal && (
              <Link
                href="/dashboard/jadwal"
                className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <CalendarDays className="size-4.5" />
                  </div>
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                  Jadwal & Agenda
                </h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                  Jadwal pelajaran mingguan, penugasan piket kebersihan, dan kalender kegiatan
                  kelas.
                </p>
              </Link>
            )}

            {canAccessPengumuman && (
              <Link
                href="/dashboard/pengumuman"
                className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <Bell className="size-4.5" />
                  </div>
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                  Pengumuman Kelas
                </h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                  Publikasikan informasi resmi untuk seluruh siswa dengan opsi sematkan penting.
                </p>
              </Link>
            )}

            {canAccessKas && (
              <Link
                href="/dashboard/kas"
                className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <QrCode className="size-4.5" />
                  </div>
                  {currentKas?.qrisImageUrl || currentKas?.danaNumber ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-success-text border-success/40"
                    >
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted">
                      Belum Ada
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                  Kas Digital
                </h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                  Kelola kode QRIS pembayaran kas kelas dan nomor e-wallet tujuan transfer siswa.
                </p>
              </Link>
            )}
          </div>
        </div>

        {(canAccessNilai || canAccessAbsensi || canAccessTugas || canAccessAuditLog) && (
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Akademik & Penilaian
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Rekapitulasi nilai mata pelajaran, presensi harian, dan bank tugas kelas.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {canAccessNilai && (
                <Link
                  href="/dashboard/nilai"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <GraduationCap className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Entry Nilai Massal
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Input nilai per mata pelajaran, jenis asesmen (tugas, UTS, UAS, praktik), dan
                    semester.
                  </p>
                </Link>
              )}

              {canAccessAbsensi && (
                <Link
                  href="/dashboard/absensi"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <UserCheck className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Entry Absensi Massal
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Catat presensi harian siswa (Hadir, Sakit, Izin, Alpa) dengan sekali simpan.
                  </p>
                </Link>
              )}

              {canAccessTugas && (
                <Link
                  href="/dashboard/tugas"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <Layers className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Bank Tugas
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Buat tugas baru, atur tenggat waktu, dan pantau status pengumpulan siswa.
                  </p>
                </Link>
              )}

              {canAccessAuditLog && (
                <Link
                  href="/dashboard/audit-log"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <History className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Audit Log Nilai/Absensi
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Riwayat perubahan data sensitif nilai dan absensi per entri (khusus Super
                    Admin).
                  </p>
                </Link>
              )}
            </div>
          </div>
        )}

        {(canAccessModerasi || canAccessBlog || canAccessPrestasi || canAccessPortofolio) && (
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Konten, Portofolio & Publikasi
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Moderasi foto, artikel blog, dan rekaman portofolio karya siswa.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {canAccessModerasi && (
                <Link
                  href="/dashboard/moderasi"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <ImageIcon className="size-4.5" />
                    </div>
                    {pendingGallery > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {pendingGallery} pending
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Moderasi Galeri & Album
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Setujui kiriman foto/video siswa dan kelola album kegiatan kelas.
                  </p>
                </Link>
              )}

              {canAccessBlog && (
                <Link
                  href="/dashboard/blog"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <BookOpen className="size-4.5" />
                    </div>
                    {pendingBlog > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {pendingBlog} pending
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Blog Kelas & Kategori
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Tulis artikel resmi, moderasi draf kiriman siswa, dan atur kategori tulisan.
                  </p>
                </Link>
              )}

              {canAccessPrestasi && (
                <Link
                  href="/dashboard/prestasi"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <Award className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Prestasi Siswa
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Pencatatan penghargaan dan medali kompetisi tingkat sekolah hingga
                    internasional.
                  </p>
                </Link>
              )}

              {canAccessPortofolio && (
                <Link
                  href="/dashboard/portofolio"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <Layers className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Portofolio Proyek
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Tinjau dan tampilkan proyek perangkat lunak unggulan karya siswa.
                  </p>
                </Link>
              )}
            </div>
          </div>
        )}

        {(canAccessInteraksi || canAccessKelulusan || canAccessAlumni) && (
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Interaksi, Komunitas & Wisuda
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Partisipasi publik, aspirasi, polling kelas, dan buku kenangan kelulusan.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canAccessInteraksi && (
                <Link
                  href="/dashboard/interaksi"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <MessageSquare className="size-4.5" />
                    </div>
                    {pendingGuestbook + pendingAspirations > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {pendingGuestbook + pendingAspirations} pending
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Buku Tamu, Aspirasi & Polling
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Moderasi komentar pengunjung, aspirasi kelas, dan pembuatan polling suara siswa.
                  </p>
                </Link>
              )}

              {canAccessKelulusan && (
                <Link
                  href="/dashboard/kelulusan"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <GraduationCap className="size-4.5" />
                    </div>
                    {pendingPesanKesan > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {pendingPesanKesan} pending
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Corner Kelulusan & Wisuda
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Pengaturan narasi wisuda, video kilas balik, dan moderasi pesan-kesan kelulusan.
                  </p>
                </Link>
              )}

              {canAccessAlumni && (
                <Link
                  href="/dashboard/alumni"
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent hover:shadow-xs"
                >
                  <div className="rounded-md bg-accent/10 p-2 text-accent-text group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-fit">
                    <UserCheck className="size-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground group-hover:text-accent-text transition-colors">
                    Testimoni Alumni
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    Kelola pesan, kutipan inspiratif, dan profil alumni yang telah berkiprah di
                    industri.
                  </p>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
