import { ArrowRight, ExternalLink, UserCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/db/schema";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

interface UserProfileBannerProps {
  profile: Profile | null;
}

export function UserProfileBanner({ profile }: UserProfileBannerProps) {
  if (!profile) return null;

  const hasCustomAvatar = Boolean(profile.avatarUrl) && !profile.avatarUrl?.includes("pngtree");
  const effectiveAvatar = hasCustomAvatar
    ? profile.avatarUrl
    : profile.yearbookPhotoUrl && !profile.yearbookPhotoUrl.includes("pngtree")
      ? profile.yearbookPhotoUrl
      : null;

  return (
    <section className="container-portal scroll-mt-28">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface/90 p-5 shadow-xs backdrop-blur-xs sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-accent bg-surface ring-2 ring-accent/20">
              {effectiveAvatar ? (
                <Image
                  src={cloudinaryOptimized(effectiveAvatar, "f_auto,q_auto,w_128,h_128,c_fill")}
                  alt={`Foto ${profile.fullName}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center font-display text-xl font-medium text-muted">
                  {getInitials(profile.fullName)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-text">
                  <UserCheck className="size-3" aria-hidden="true" />
                  Profil Kamu Sedang Aktif
                </span>
                {profile.absenNumber ? (
                  <span className="rounded-md border border-border px-1.5 py-0.2 font-mono text-[11px] text-muted">
                    Absen No. {profile.absenNumber}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-1 truncate font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                Halo, {profile.fullName}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Foto dan profilmu sudah aktif & tampil pada daftar siswa di Beranda ini.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            {profile.slug ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href={`/direktori/${profile.slug}`}>
                  <span>Halaman Profil</span>
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}

            <Button asChild size="sm" className="gap-1.5 text-xs">
              <Link href="/profil-saya">
                <span>Kelola Profil Saya</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
