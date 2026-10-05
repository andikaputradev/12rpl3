import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AchievementCard } from "@/components/prestasi/achievement-card";
import { PortfolioCard } from "@/components/prestasi/portfolio-card";
import { TestimonialCard } from "@/components/prestasi/testimonial-card";
import { Button } from "@/components/ui/button";
import {
  getAchievements,
  getAlumniTestimonials,
  getPortfolioProjects,
} from "@/lib/actions/prestasi";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Prestasi & Portofolio",
  description:
    "Prestasi resmi kelas, portofolio proyek RPL siswa, dan testimoni alumni Kelas XII RPL 3.",
};

async function getCurrentStudentStatus(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return profile?.role === "siswa";
}

export default async function PrestasiPage() {
  const [achievements, portfolioProjects, testimonials, isStudent] = await Promise.all([
    getAchievements(),
    getPortfolioProjects(),
    getAlumniTestimonials(),
    getCurrentStudentStatus(),
  ]);

  return (
    <div className="flex flex-col">
      <section className="container-portal py-16 sm:py-20">
        <p data-eyebrow>Prestasi & Portofolio</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Pencapaian dan Karya Kelas Kami
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Rekam jejak prestasi resmi kelas dan portofolio proyek Rekayasa Perangkat Lunak dari
          siswa-siswi Kelas XII RPL 3.
        </p>
      </section>

      <section className="container-portal pb-16">
        <h2 className="font-display text-2xl font-medium tracking-tight">Prestasi</h2>
        {achievements.length === 0 ? (
          <p className="mt-6 rounded-md border border-border border-dashed py-12 text-center text-muted text-sm">
            Belum ada prestasi tercatat.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </section>

      <section className="container-portal pb-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-medium tracking-tight">Portofolio Proyek</h2>
        </div>
        {portfolioProjects.length === 0 ? (
          <p className="mt-6 rounded-md border border-border border-dashed py-12 text-center text-muted text-sm">
            Belum ada proyek yang disetujui untuk ditampilkan.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioProjects.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        )}
        {isStudent ? (
          <div className="mt-8">
            <Button asChild>
              <Link href="/portofolio/submit">Submit Proyek Kamu</Link>
            </Button>
          </div>
        ) : null}
      </section>

      {/* Section tersembunyi TOTAL saat kosong - bukan judul dengan isi kosong (Bagian 5 brief). */}
      {testimonials.length > 0 ? (
        <section className="container-portal pb-20">
          <h2 className="font-display text-2xl font-medium tracking-tight">Testimoni Alumni</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
