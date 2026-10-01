"use client";

import { useState } from "react";
import { Lightbox } from "@/components/galeri/lightbox";
import { MasonryGrid } from "@/components/galeri/masonry-grid";
import type { GalleryItem } from "@/lib/db/schema";

export function GalleryViewer({
  items,
  currentUserId,
}: {
  items: GalleryItem[];
  currentUserId: string | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <MasonryGrid items={items} currentUserId={currentUserId} onItemClick={setSelectedIndex} />
      <Lightbox
        items={items}
        selectedIndex={selectedIndex}
        currentUserId={currentUserId}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
      />
    </>
  );
}
