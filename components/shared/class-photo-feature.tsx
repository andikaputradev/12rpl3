"use client";

import { Camera } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { siteConfig } from "@/lib/config/site";
import { cloudinaryOptimized } from "@/lib/utils";

export function ClassPhotoFeature({ url }: { url: string | null }) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-xl border border-border"
    >
      {url ? (
        <div className="relative aspect-[16/9] w-full bg-surface">
          <Image
            src={cloudinaryOptimized(url)}
            alt={`Foto kelas ${siteConfig.className}`}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="relative flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 bg-surface/50 px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-border/40 text-muted">
            <Camera className="size-6" aria-hidden="true" />
          </div>
          <p className="max-w-xs text-sm text-muted">
            Foto kelas utama belum diunggah. Wali Kelas atau Pengurus dapat menambahkannya lewat
            dashboard admin.
          </p>
        </div>
      )}
    </motion.figure>
  );
}
