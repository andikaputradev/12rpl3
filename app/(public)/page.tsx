import { ArrowRight, Award, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { QuickJumpBar } from "@/components/beranda/quick-jump-bar";
import { TodayScheduleWidget } from "@/components/beranda/today-schedule-widget";
import { UserProfileBanner } from "@/components/beranda/user-profile-banner";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { AlbumCard } from "@/components/galeri/album-card";
import { GuestbookWall } from "@/components/interaksi/guestbook-wall";
import { PollCard } from "@/components/interaksi/poll-card";
import { AchievementCard } from "@/components/prestasi/achievement-card";
import { PortfolioCard } from "@/components/prestasi/portfolio-card";
import { ClassMemberCard } from "@/components/shared/class-member-card";
import { ClassPhotoFeature } from "@/components/shared/class-photo-feature";
import { Hero } from "@/components/shared/hero";
import { HighlightCard } from "@/components/shared/highlight-card";
import { OrgStructureCard } from "@/components/shared/org-structure-card";
import { StatCounter } from "@/components/shared/stat-counter";
import { StatRatioBar } from "@/components/shared/stat-ratio-bar";
import { VisitorBadge } from "@/components/shared/visitor-badge";
import { WaliKelasCard } from "@/components/shared/wali-kelas-card";
import { Button } from "@/components/ui/button";
import {
  getActiveHighlights,
  getClassProfile,
  getFeaturedCountdown,
  getOrganizationalStructure,
  getStudentStats,
  getVisitorCount,
  getWaliKelas,
} from "@/lib/actions/beranda";
import { getPublishedPosts } from "@/lib/actions/blog";
import { getStudentList } from "@/lib/actions/direktori";
import { getAlbums } from "@/lib/actions/galeri";
import { getOptionalUser } from "@/lib/actions/guard";
import {
  getGuestbookEntries,
  getMyVote,
  getPollResults,
  getPolls,
  type PollWithOptions,
} from "@/lib/actions/interaksi";
import {
  getClassSchedule,
  getPiketSchedule,
  getUpcomingAcademicEvents,
} from "@/lib/actions/jadwal";
import { getAchievements, getPortfolioProjects } from "@/lib/actions/prestasi";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const classProfile = await getClassProfile();
  return {
    title: `Beranda | ${siteConfig.className} ${siteConfig.schoolName}`,
    description: classProfile?.motto ?? siteConfig.tagline,
    alternates: { canonical: "/" },
  };
}

export default async function BerandaPage() {
  const [
    classProfile,
    featuredEvent,
    stats,
    highlights,
    visitorCount,
    students,
    schedule,
    piketDays,
    upcomingEvents,
    waliKelas,
    pengurus,
    achievements,
    portfolioProjects,
    galleryData,
    blogData,
    polls,
    guestbookEntries,
    auth,
  ] = await Promise.all([
    getClassProfile(),
    getFeaturedCountdown(),
    getStudentStats(),
    getActiveHighlights(),
    getVisitorCount(),
    getStudentList(),
    getClassSchedule(),
    getPiketSchedule(),
    getUpcomingAcademicEvents(5),
    getWaliKelas(),
    getOrganizationalStructure(),
    getAchievements(),
    getPortfolioProjects(),
    getAlbums(),
    getPublishedPosts(),
    getPolls(),
    getGuestbookEntries("umum"),
    getOptionalUser(),
  ]);

  // Petugas pengurus inti untuk struktur organisasi
  const ketua =
    pengurus.find(
      (p) =>
        (p.jabatan ?? "").toLowerCase().includes("ketua") &&
        !(p.jabatan ?? "").toLowerCase().includes("wakil"),
    ) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("wahyu andika")) ??
    null;

  const wakilKetua =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("wakil")) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("zaeni")) ??
    null;

  const sekretaris1 =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("sekretaris 1")) ??
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("sekretaris")) ??
    null;

  const bendahara1 =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("bendahara 1")) ??
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("bendahara")) ??
    null;

  // Poll aktif teratas (jika ada)
  const activePoll = polls.find((p) => !p.isClosed) ?? polls[0];
  let activePollData: {
    poll: PollWithOptions;
    myVote: string[];
    results: Awaited<ReturnType<typeof getPollResults>> | null;
  } | null = null;

  if (activePoll) {
    const myVote = await getMyVote(activePoll.id);
    const shouldShowResults =
      myVote.length > 0 || activePoll.isClosed || activePoll.showResultsBeforeClose;
    const results = shouldShowResults ? await getPollResults(activePoll.id) : null;
    activePollData = { poll: activePoll, myVote, results };
  }

  return (
    <>
      {/* 1. Hero Section */}
      <Hero classProfile={classProfile} featuredEvent={featuredEvent} />

      {/* Quick Jump Anchor Bar */}
      <QuickJumpBar />

      {/* Profil Pengguna Aktif (Jika Login) */}
      {auth ? (
        <div className="pt-6">
          <UserProfileBanner profile={auth.profile} />
        </div>
      ) : null}

      <div className="flex flex-col gap-24 py-16">
        {/* 2. Section Jadwal & Agenda Hari Ini */}
        <section id="jadwal-hari-ini" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Agenda & Jadwal</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Hari Ini di Kelas Kami
              </h2>
              <p className="mt-1 text-muted text-sm">
                Jadwal pelajaran, petugas piket kelas hari ini, dan kalender kegiatan terdekat.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
              <Link href="/jadwal" prefetch={false}>
                Buka Jadwal Lengkap
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-6">
            <TodayScheduleWidget
              schedule={schedule}
              piketDays={piketDays}
              upcomingEvents={upcomingEvents}
            />
          </div>
        </section>

        {/* 3. Section Profil & Struktur Organisasi */}
        <section id="profil-kelas" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Tentang Kami</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Profil & Struktur Kelas
              </h2>
              <p className="mt-1 text-muted text-sm">
                Visi, misi, bimbingan wali kelas, dan kepengurusan siswa {siteConfig.className}.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
              <Link href="/profil" prefetch={false}>
                Lihat Selengkapnya
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Kartu Wali Kelas */}
            <div className="flex flex-col gap-4">
              <h3 className="font-display font-medium text-foreground text-sm uppercase tracking-wider text-muted">
                Wali Kelas
              </h3>
              {waliKelas ? (
                <WaliKelasCard waliKelas={waliKelas} />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted text-xs">
                  Belum ada profil Wali Kelas yang ditetapkan.
                </div>
              )}
            </div>

            {/* Pengurus Inti Kelas */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <h3 className="font-display font-medium text-foreground text-sm uppercase tracking-wider text-muted">
                Pengurus Inti Kelas
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <OrgStructureCard profile={ketua} fallbackLabel="Ketua Kelas" tier={1} />
                <OrgStructureCard profile={wakilKetua} fallbackLabel="Wakil Ketua" tier={2} />
                <OrgStructureCard profile={sekretaris1} fallbackLabel="Sekretaris" tier={3} />
                <OrgStructureCard profile={bendahara1} fallbackLabel="Bendahara" tier={3} />
              </div>

              {/* Visi & Misi Ringkas */}
              {classProfile?.visi ? (
                <div className="mt-2 rounded-xl border border-border bg-surface p-5 text-sm">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent-text">
                    Visi Kelas
                  </span>
                  <p className="mt-1 font-medium text-foreground leading-relaxed">
                    "{classProfile.visi}"
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Foto Kelas Unggulan */}
          <div className="mt-8">
            <ClassPhotoFeature url={classProfile?.fotoKelasUrl ?? null} />
          </div>
        </section>

        {/* 4. Section Anggota Kelas & Statistik */}
        <section id="anggota-kelas" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Direktori Siswa</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                {students.length} Siswa, Satu Keluarga
              </h2>
              <p className="mt-1 text-muted text-sm">
                Profil lengkap siswa-siswi Rekayasa Perangkat Lunak 3.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
              <Link href="/direktori" prefetch={false}>
                Cari Siswa di Direktori
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Statistik Siswa */}
          <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:p-8">
            <div className="grid grid-cols-3 gap-6 sm:max-w-md">
              <StatCounter value={stats.total} label="Total Siswa" />
              <StatCounter value={stats.laki} label="Laki-laki" />
              <StatCounter value={stats.perempuan} label="Perempuan" />
            </div>
            <div className="max-w-lg">
              <StatRatioBar laki={stats.laki} perempuan={stats.perempuan} />
            </div>
          </div>

          {/* Grid Anggota Siswa */}
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {students.map((student) => (
              <ClassMemberCard
                key={student.id}
                student={student}
                isCurrentUser={auth?.userId === student.id}
              />
            ))}
          </div>
        </section>

        {/* 5. Section Karya & Prestasi Siswa */}
        <section id="karya-prestasi" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Portofolio & Prestasi</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Pencapaian & Karya Siswa RPL
              </h2>
              <p className="mt-1 text-muted text-sm">
                Proyek perangkat lunak buatan siswa dan penghargaan yang membanggakan kelas.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
              <Link href="/prestasi" prefetch={false}>
                Lihat Semua Prestasi & Proyek
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Sub-grid Prestasi */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-accent" />
              <h3 className="font-display font-medium text-foreground">Prestasi Resmi Terbaru</h3>
            </div>
            {achievements.length === 0 ? (
              <p className="rounded-xl border border-border border-dashed p-6 text-center text-muted text-sm">
                Belum ada data prestasi yang tercatat.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.slice(0, 3).map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </div>

          {/* Sub-grid Portofolio Proyek RPL */}
          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="font-display font-medium text-foreground">Karya Proyek Siswa</h3>
            </div>
            {portfolioProjects.length === 0 ? (
              <p className="rounded-xl border border-border border-dashed p-6 text-center text-muted text-sm">
                Belum ada proyek siswa yang dipublikasikan.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {portfolioProjects.slice(0, 3).map((project) => (
                  <PortfolioCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 6. Section Sorotan & Galeri Foto Kegiatan */}
        <section id="galeri-kegiatan" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Dokumentasi Visual</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Galeri Foto & Momen Kelas
              </h2>
              <p className="mt-1 text-muted text-sm">
                Dokumentasi kegiatan belajar, praktikum, study tour, dan kebersamaan kami.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
              <Link href="/galeri" prefetch={false}>
                Buka Galeri Foto
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Highlights Sorotan Jika Ada */}
          {highlights.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((highlight, index) => (
                <HighlightCard key={highlight.id} highlight={highlight} index={index} />
              ))}
            </div>
          ) : null}

          {/* Album Galeri */}
          <div className="mt-8">
            {galleryData.albums.length === 0 ? (
              <p className="rounded-xl border border-border border-dashed p-8 text-center text-muted text-sm">
                Belum ada album foto dalam galeri.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {galleryData.albums.slice(0, 3).map((album, index) => (
                  <AlbumCard key={album.id} album={album} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 7. Section Blog & Cerita Kelas */}
        <section id="blog-terbaru" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Publikasi Siswa</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Kabar & Tulisan Terbaru
              </h2>
              <p className="mt-1 text-muted text-sm">
                Artikel, catatan belajar, pengalaman praktikum, dan karya tulis siswa RPL 3.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
              <Link href="/blog" prefetch={false}>
                Baca Semua Artikel
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8">
            {blogData.posts.length === 0 ? (
              <p className="rounded-xl border border-border border-dashed p-8 text-center text-muted text-sm">
                Belum ada artikel blog yang dipublikasikan.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {blogData.posts.slice(0, 3).map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 8. Section Interaksi, Polling & Buku Tamu */}
        <section id="interaksi-kelas" className="container-portal scroll-mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-eyebrow>Interaksi & Komunitas</p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Suara Kelas & Buku Tamu
              </h2>
              <p className="mt-1 text-muted text-sm">
                Jajak pendapat aktif dan pesan sapaan hangat dari para pengunjung portal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
                <Link href="/interaksi/buku-tamu" prefetch={false}>
                  Isi Buku Tamu
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-fit gap-1 text-xs">
                <Link href="/interaksi/polling" prefetch={false}>
                  Polling Lengkap
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Polling Widget */}
            <div className="flex flex-col gap-3">
              <h3 className="font-display font-medium text-foreground text-sm uppercase tracking-wider text-muted">
                Polling Terkini
              </h3>
              {activePollData ? (
                <PollCard
                  poll={activePollData.poll}
                  myVote={activePollData.myVote}
                  results={activePollData.results}
                  isAuthenticated={Boolean(auth)}
                />
              ) : (
                <div className="rounded-xl border border-border border-dashed p-6 text-center text-muted text-sm">
                  Tidak ada polling yang sedang aktif saat ini.
                </div>
              )}
            </div>

            {/* Buku Tamu Feed */}
            <div className="flex flex-col gap-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-medium text-foreground text-sm uppercase tracking-wider text-muted">
                  Pesan Buku Tamu Terbaru
                </h3>
                <span className="font-mono text-xs text-muted">
                  {guestbookEntries.length} Pesan Disetujui
                </span>
              </div>
              <GuestbookWall entries={guestbookEntries.slice(0, 4)} />
            </div>
          </div>
        </section>

        {/* 9. Counter & Penutup */}
        <div className="container-portal flex items-center justify-between border-border border-t pt-8">
          <p className="text-muted text-xs">
            Portal Resmi Kelas XII Rekayasa Perangkat Lunak 3 - SMK Negeri 1 Sukoharjo.
          </p>
          <VisitorBadge count={visitorCount} />
        </div>
      </div>
    </>
  );
}
