import type { Metadata } from "next";
import Link from "next/link";
import { ClassMemberCard } from "@/components/shared/class-member-card";
import { ClassPhotoFeature } from "@/components/shared/class-photo-feature";
import { Hero } from "@/components/shared/hero";
import { HighlightCard, HighlightsEmptyState } from "@/components/shared/highlight-card";
import { StatCounter } from "@/components/shared/stat-counter";
import { StatRatioBar } from "@/components/shared/stat-ratio-bar";
import { VisitorBadge } from "@/components/shared/visitor-badge";
import { Button } from "@/components/ui/button";
import {
  getActiveHighlights,
  getClassProfile,
  getFeaturedCountdown,
  getStudentStats,
  getVisitorCount,
} from "@/lib/actions/beranda";
import { getStudentList } from "@/lib/actions/direktori";
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
  const [classProfile, featuredEvent, stats, highlights, visitorCount, students] =
    await Promise.all([
      getClassProfile(),
      getFeaturedCountdown(),
      getStudentStats(),
      getActiveHighlights(),
      getVisitorCount(),
      getStudentList(),
    ]);

  return (
    <>
      <Hero classProfile={classProfile} featuredEvent={featuredEvent} />

      <section className="container-portal py-20">
        <p data-eyebrow>Statistik Kelas</p>
        <div className="mt-6 grid grid-cols-3 gap-6 sm:max-w-xl">
          <StatCounter value={stats.total} label="Total Siswa" />
          <StatCounter value={stats.laki} label="Laki-laki" />
          <StatCounter value={stats.perempuan} label="Perempuan" />
        </div>
        <div className="mt-8 max-w-xl">
          <StatRatioBar laki={stats.laki} perempuan={stats.perempuan} />
        </div>
      </section>

      <section className="container-portal pb-20">
        <p data-eyebrow>Anggota Kelas</p>
        <h2 className="mt-2 max-w-lg font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {students.length} wajah, satu kelas.
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {students.map((student) => (
            <ClassMemberCard key={student.id} student={student} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/direktori">Lihat Direktori Lengkap</Link>
          </Button>
        </div>
      </section>

      <section className="container-portal py-4 pb-20">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p data-eyebrow>Sorotan Kegiatan</p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Kabar terbaru dari kelas kami
            </h2>
          </div>
        </div>

        <div className="mt-10">
          {highlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((highlight, index) => (
                <HighlightCard key={highlight.id} highlight={highlight} index={index} />
              ))}
            </div>
          ) : (
            <HighlightsEmptyState />
          )}
        </div>
      </section>

      <section className="container-portal pb-20">
        <p data-eyebrow>Kelas Kami</p>
        <h2 className="mt-2 max-w-lg font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {siteConfig.className}, satu keluarga satu tujuan.
        </h2>
        <div className="mt-8">
          <ClassPhotoFeature url={classProfile?.fotoKelasUrl ?? null} />
        </div>
      </section>

      <div className="container-portal flex justify-end pb-10">
        <VisitorBadge count={visitorCount} />
      </div>
    </>
  );
}
