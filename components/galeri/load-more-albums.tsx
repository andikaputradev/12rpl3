"use client";

import { Images, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { AlbumCard } from "@/components/galeri/album-card";
import { Button } from "@/components/ui/button";
import type { AlbumWithCount } from "@/lib/actions/galeri";
import { loadMoreAlbumsAction } from "@/lib/actions/galeri-mutations";
import type { galleryCategories } from "@/lib/validations/galeri";

interface LoadMoreAlbumsProps {
  initialAlbums: AlbumWithCount[];
  initialCursor: string | null;
  category?: (typeof galleryCategories)[number];
}

export function LoadMoreAlbums({ initialAlbums, initialCursor, category }: LoadMoreAlbumsProps) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMoreAlbumsAction(category, cursor);
      setAlbums((prev) => [...prev, ...result.albums]);
      setCursor(result.nextCursor);
    });
  }

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
        <Images className="size-6 text-muted" aria-hidden="true" />
        <p className="max-w-sm text-sm text-muted">Belum ada album pada kategori ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {albums.map((album, index) => (
          <AlbumCard key={album.id} album={album} index={index} />
        ))}
      </div>

      {cursor ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Memuat..." : "Muat Lebih Banyak"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
