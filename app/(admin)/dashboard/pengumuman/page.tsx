import type { Metadata } from "next";
import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { getAnnouncements } from "@/lib/actions/akademik";

export const metadata: Metadata = {
  title: "Pengumuman — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPengumumanPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Pengumuman
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Tampil untuk seluruh peran terautentikasi di /akademik/pengumuman.
        </p>
      </header>

      <AnnouncementManager announcements={announcements} />
    </div>
  );
}
