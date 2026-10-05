"use client";

import { ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AlbumWithCount } from "@/lib/actions/galeri";
import { cloudinaryOptimized } from "@/lib/utils";
import { galleryCategoryLabels } from "@/lib/validations/galeri";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function AlbumCard({ album, index }: { album: AlbumWithCount; index: number }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 8) * 0.06 }}
    >
      <Link href={`/galeri/${album.slug}`} prefetch={false} className="group block cursor-pointer">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface">
          {album.coverImageUrl ? (
            <Image
              src={cloudinaryOptimized(album.coverImageUrl)}
              alt={album.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="size-8 text-muted" aria-hidden="true" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge>{galleryCategoryLabels[album.category]}</Badge>
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{album.title}</p>
            {album.eventDate ? (
              <p className="font-mono text-xs text-muted">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                  new Date(album.eventDate),
                )}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 font-mono text-xs text-muted">
            {album.approvedItemCount} item
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
