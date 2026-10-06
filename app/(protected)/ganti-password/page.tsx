import { ArrowLeft, Home, KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordCard } from "@/components/profil-saya/change-password-card";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/actions/guard";

export const metadata: Metadata = {
  title: "Ganti Kata Sandi",
  description: "Perbarui kata sandi akun Anda.",
  robots: { index: false, follow: false },
};

export default async function GantiPasswordPage() {
  await requireAuthenticatedUser();

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
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
          <Link
            href="/profil-saya"
            prefetch={false}
            className="transition-colors hover:text-foreground"
          >
            Profil Saya
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">Ganti Kata Sandi</span>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent-text">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Ganti Kata Sandi
              </h1>
              <p className="text-xs text-muted">
                Perbarui kata sandi akun Anda tanpa verifikasi email atau tautan masuk.
              </p>
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link href="/profil-saya" prefetch={false}>
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Kembali</span>
            </Link>
          </Button>
        </div>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
