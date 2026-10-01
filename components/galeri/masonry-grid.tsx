"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { StatusBadge } from "@/components/shared/status-badge";
import type { GalleryItem } from "@/lib/db/schema";
import { cloudinaryOptimized } from "@/lib/utils";

interface MasonryGridProps {
  items: GalleryItem[];
  currentUserId: string | null;
  onItemClick: (index: number) => void;
}

export function MasonryGrid({ items, currentUserId, onItemClick }: MasonryGridProps) {
  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
      {items.map((item, index) => {
        const isOwnPending = item.status === "pending_review" && item.uploadedBy === currentUserId;

        return (
          <motion.button
            type="button"
            key={item.id}
            layoutId={`gallery-item-${item.id}`}
            onClick={() => onItemClick(index)}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35 }}
            className="relative block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-surface [break-inside:avoid]"
          >
            {item.type === "image" ? (
              <div className="relative aspect-square w-full">
                <Image
                  src={cloudinaryOptimized(item.mediaUrl)}
                  alt={item.caption ?? "Foto kegiatan kelas"}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full">
                <Image
                  src={
                    item.thumbnailUrl ?? `https://img.youtube.com/vi/${item.mediaUrl}/hqdefault.jpg`
                  }
                  alt={item.caption ?? "Thumbnail video"}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white">
                  <YoutubeIcon />
                </span>
              </div>
            )}

            {isOwnPending ? (
              <span className="absolute top-2 left-2">
                <StatusBadge status="pending_review" />
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M9.5 8.5v7l6-3.5-6-3.5Z" />
    </svg>
  );
}
