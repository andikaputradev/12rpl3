import type { Metadata } from "next";
import { AlbumManager } from "@/components/admin/album-manager";
import { ModerationQueue } from "@/components/admin/moderation-queue";
import { getPendingModeration } from "@/lib/actions/admin-galeri";
import { getAllAlbumsForAdmin } from "@/lib/actions/galeri";

export const metadata: Metadata = {
  title: "Moderasi Konten — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ModerasiPage() {
  const [pendingItems, albums] = await Promise.all([
    getPendingModeration(),
    getAllAlbumsForAdmin(),
  ]);

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Moderasi Konten
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {pendingItems.length} kiriman menunggu peninjauan.
        </p>
      </header>

      <ModerationQueue initialItems={pendingItems} />

      <AlbumManager albums={albums} />
    </div>
  );
}
