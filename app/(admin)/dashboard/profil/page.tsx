import type { Metadata } from "next";
import { ClassProfileForm } from "@/components/admin/class-profile-form";
import { EventsManager } from "@/components/admin/events-manager";
import { HighlightsManager } from "@/components/admin/highlights-manager";
import {
  getAllAcademicEvents,
  getAllHighlightsForAdmin,
  getClassProfile,
} from "@/lib/actions/beranda";

export const metadata: Metadata = {
  title: "Profil Kelas — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProfilPage() {
  const [classProfile, highlights, events] = await Promise.all([
    getClassProfile(),
    getAllHighlightsForAdmin(),
    getAllAcademicEvents(),
  ]);

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Profil Kelas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Perubahan di sini langsung tampil di Beranda dan Profil Kelas publik setelah disimpan.
        </p>
      </header>

      <ClassProfileForm classProfile={classProfile} />
      <HighlightsManager highlights={highlights} />
      <EventsManager events={events} />
    </div>
  );
}
