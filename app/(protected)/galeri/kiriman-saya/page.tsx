import { ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { getMyUploads } from "@/lib/actions/galeri";
import { cloudinaryOptimized } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kiriman Saya — Galeri",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function KirimanSayaPage() {
  const uploads = await getMyUploads();

  return (
    <div>
      <header className="max-w-lg">
        <p data-eyebrow>Galeri</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kiriman Saya
        </h1>
      </header>

      <div className="mt-10 flex flex-col gap-3">
        {uploads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-10 text-center text-sm text-muted">
            Belum ada kiriman. Mulai unggah lewat menu "Unggah Foto".
          </p>
        ) : (
          uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-background">
                {upload.type === "image" ? (
                  <Image
                    src={cloudinaryOptimized(upload.mediaUrl, "f_auto,q_auto,w_128,h_128,c_fill")}
                    alt={upload.caption ?? "Foto kiriman"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="size-5 text-muted" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/galeri/${upload.albumSlug}`}
                  className="cursor-pointer truncate text-sm font-medium hover:underline"
                >
                  {upload.albumTitle}
                </Link>
                {upload.caption ? (
                  <p className="truncate text-xs text-muted">{upload.caption}</p>
                ) : null}
                {upload.status === "rejected" && upload.rejectionReason ? (
                  <p className="mt-1 text-xs text-destructive-text">
                    Alasan: {upload.rejectionReason}
                  </p>
                ) : null}
              </div>

              <StatusBadge status={upload.status as "pending_review" | "approved" | "rejected"} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
