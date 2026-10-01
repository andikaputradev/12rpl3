"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type { YearbookEntry } from "@/lib/actions/kelulusan";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

interface YearbookGridProps {
  entries: YearbookEntry[];
}

/**
 * Reveal rotasi kecil + scale + fade, menyerupai foto yang diletakkan satu
 * per satu ke halaman yearbook (Bagian 6 prompt): berbeda dari grid
 * Direktori yang lebih netral (components/shared/class-member-card.tsx).
 * Rotasi bergantian arah per indeks agar terasa "ditempel" alami, bukan
 * seragam kaku. Menghormati prefers-reduced-motion: jatuh ke fade sederhana
 * tanpa rotasi/scale saat diaktifkan (Bagian 11 prompt).
 */
export function YearbookGrid({ entries }: YearbookGridProps) {
  const prefersReducedMotion = useReducedMotion();

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-border border-dashed bg-surface/50 px-4 py-10 text-center text-muted text-sm">
        Belum ada entri yearbook.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map((entry, index) => {
        const tilt = index % 2 === 0 ? -3 : 3;
        const hidden = prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.88, rotate: tilt, y: 18 };
        const show = prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, rotate: 0, y: 0 };

        return (
          <motion.div
            key={entry.id}
            initial={hidden}
            whileInView={show}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: prefersReducedMotion ? 0.25 : 0.5,
              ease: [0.16, 1, 0.3, 1],
              delay: (index % 8) * 0.05,
            }}
            className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-surface p-3.5 text-center shadow-sm"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/20">
              {entry.photoUrl ? (
                <Image
                  src={cloudinaryOptimized(entry.photoUrl, "f_auto,q_auto,w_300,h_300,c_fill")}
                  alt={`Foto yearbook ${entry.fullName}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center font-display text-2xl text-muted">
                  {getInitials(entry.fullName)}
                </div>
              )}
            </div>
            <p className="font-medium text-sm">{entry.fullName}</p>
            {entry.yearbookQuote ? (
              <p className="text-muted text-xs italic leading-snug">“{entry.yearbookQuote}”</p>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
