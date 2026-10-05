import { Quote } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SocialLinks } from "@/components/direktori/social-links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllPublicStudentSlugs, getStudentBySlug } from "@/lib/actions/direktori";
import { siteConfig } from "@/lib/config/site";
import { cloudinaryOptimized } from "@/lib/utils";

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublicStudentSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error(
      "[generateStaticParams] Gagal mengambil slug siswa saat build, lanjut tanpa pre-render statis:",
      error,
    );
    return [];
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface StudentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StudentDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const student = await getStudentBySlug(slug);

  if (!student) {
    return { title: "Siswa Tidak Ditemukan", robots: { index: false, follow: true } };
  }

  return {
    title: `${student.fullName} | Direktori Siswa`,
    description: `Profil ${student.fullName}, siswa ${siteConfig.className}.`,
    // Sengaja noindex: langkah privasi tambahan untuk populasi yang sebagian
    // besar berstatus di bawah umur, meski data sudah ditandai publik oleh
    // yang bersangkutan. Grid direktori tetap terindeks normal.
    robots: { index: false, follow: true },
  };
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { slug } = await params;
  const student = await getStudentBySlug(slug);

  if (!student) notFound();

  return (
    <div className="container-portal max-w-2xl py-20">
      <div className="flex flex-col items-center gap-5 text-center">
        <Avatar className="size-28">
          {student.avatarUrl && !student.avatarUrl.includes("pngtree") ? (
            <AvatarImage
              src={cloudinaryOptimized(student.avatarUrl, "f_auto,q_auto,w_224,h_224,c_fill")}
              alt={`Foto ${student.fullName}`}
            />
          ) : null}
          <AvatarFallback className="text-2xl">{getInitials(student.fullName)}</AvatarFallback>
        </Avatar>

        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            {student.fullName}
          </h1>
          {student.absenNumber ? (
            <p className="mt-1 font-mono text-sm text-muted">No. Absen {student.absenNumber}</p>
          ) : null}
        </div>

        <SocialLinks socialLinks={student.socialLinks} />
      </div>

      {student.bio ? (
        <section className="mt-14">
          <h2 className="font-display text-lg font-medium tracking-tight">Bio</h2>
          <p className="mt-3 leading-relaxed text-muted">{student.bio}</p>
        </section>
      ) : null}

      {student.citaCita ? (
        <section className="mt-10 flex items-start gap-3 rounded-lg border border-border bg-surface px-5 py-4">
          <Quote className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden="true" />
          <div>
            <p data-eyebrow>Cita-cita</p>
            <p className="mt-1 text-foreground">{student.citaCita}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
