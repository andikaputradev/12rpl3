import { UserCog } from "lucide-react";
import type { Metadata } from "next";
import { ProfilSayaForm } from "@/components/profil-saya/profil-saya-form";
import { requireAuthenticatedUser } from "@/lib/actions/guard";

export const metadata: Metadata = {
  title: "Profil Saya",
};

export default async function ProfilSayaPage() {
  const { profile } = await requireAuthenticatedUser();

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 text-accent-text">
          <UserCog className="size-5" aria-hidden="true" />
          <p className="font-medium text-sm uppercase tracking-wide">Akun</p>
        </div>
        <h1 className="mt-2 font-display text-3xl">Profil Saya</h1>
        <p className="mt-2 text-muted">
          Kelola bio, cita-cita, tautan media sosial, dan tampilan yearbook-mu.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <ProfilSayaForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
