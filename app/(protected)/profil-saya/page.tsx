import { ArrowLeft, ExternalLink, Home, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfilSayaForm } from "@/components/profil-saya/profil-saya-form";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/actions/guard";

export const metadata: Metadata = {
  title: "Profil Saya",
  description: "Kelola foto profil, bio, cita-cita, dan tampilan publik di portal kelas.",
};

const ROLE_LABELS: Record<string, string> = {
  siswa: "Siswa",
  pengurus: "Pengurus Kelas",
  wali_kelas: "Wali Kelas",
  super_admin: "Administrator",
};

export default async function ProfilSayaPage() {
  const { profile } = await requireAuthenticatedUser();
  const rawProfile = profile as Record<string, unknown>;
  const role = (profile.role ?? rawProfile?.role ?? "siswa") as string;
  const absenNumber = (profile.absenNumber ?? rawProfile?.absen_number) as
    | number
    | null
    | undefined;
  const nis = (profile.nis ?? rawProfile?.nis) as string | null | undefined;
  const slug = (profile.slug ?? rawProfile?.slug) as string | null | undefined;

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Navigasi Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="size-3.5" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">Profil Saya</span>
        </nav>

        {/* Header Profil */}
        <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 font-medium text-xs text-accent-text">
                <User className="size-3" aria-hidden="true" />
                {ROLE_LABELS[role] ?? role}
              </span>
              {absenNumber ? (
                <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted">
                  No. Absen {absenNumber}
                </span>
              ) : null}
              {nis ? (
                <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted">
                  NIS {nis}
                </span>
              ) : null}
            </div>

            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Pengaturan Profil Saya
            </h1>
            <p className="mt-2 text-sm text-muted leading-relaxed max-w-xl">
              Kelola foto profil utama, foto yearbook kelulusan, bio, cita-cita, dan tautan media
              sosial. Informasi ini langsung aktif dan tampil pada daftar siswa di Beranda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {slug ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href={`/direktori/${slug}`} prefetch={false}>
                  <span>Halaman Profil</span>
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/" prefetch={false}>
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>Ke Beranda</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Formulir Pengaturan Profil */}
        <div className="mt-8">
          <ProfilSayaForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
