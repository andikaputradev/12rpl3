import type { Metadata } from "next";
import { KasSettingsForm } from "@/components/admin/kas-settings-form";
import { getKasSettings } from "@/lib/actions/kas";

export const metadata: Metadata = {
  title: "Kas Digital — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminKasPage() {
  const settings = await getKasSettings();

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Kas Digital
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Perubahan langsung tampil di halaman Kas Kelas untuk seluruh siswa yang login.
        </p>
      </header>

      <KasSettingsForm settings={settings} />
    </div>
  );
}
