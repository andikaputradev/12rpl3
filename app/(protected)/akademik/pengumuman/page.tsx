import type { Metadata } from "next";
import { AnnouncementCard } from "@/components/akademik/announcement-card";
import { getAnnouncements } from "@/lib/actions/akademik";

export const metadata: Metadata = {
  title: "Pengumuman",
  robots: { index: false, follow: false },
};

export default async function PengumumanPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="container-portal py-16">
      <p data-eyebrow>Akademik</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Pengumuman</h1>
      <p className="mt-3 text-muted">
        Informasi internal kelas — pengumuman disematkan tampil di atas.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {announcements.length === 0 ? (
          <p className="rounded-md border border-border border-dashed py-12 text-center text-muted text-sm">
            Belum ada pengumuman.
          </p>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))
        )}
      </div>
    </div>
  );
}
