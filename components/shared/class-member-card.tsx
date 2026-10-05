"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { StudentListItem } from "@/lib/actions/direktori";
import { cloudinaryOptimized, cn, getInitials } from "@/lib/utils";

/**
 * whileInView dipasang PER KARTU (bukan satu container stagger untuk
 * seluruh grid) - setiap kartu memicu animasinya sendiri persis saat kartu
 * itu memasuki viewport, mengikuti kecepatan scroll pengguna secara alami.
 * Untuk grid puluhan siswa, satu stagger container tunggal akan menghitung
 * delay dari satu titik pemicu di awal, membuat kartu jauh di bawah "meledak"
 * bersamaan begitu ikut ter-mount, bukan reveal yang terasa alami.
 */
export function ClassMemberCard({
  student,
  isCurrentUser = false,
}: {
  student: StudentListItem;
  isCurrentUser?: boolean;
}) {
  const hasCustomAvatar = Boolean(student.avatarUrl) && !student.avatarUrl?.includes("pngtree");

  const content = (
    <div className="group relative flex flex-col items-center gap-2.5 text-center">
      <div
        className={cn(
          "relative size-[150px] overflow-hidden rounded-full border border-border bg-surface transition-transform duration-200 group-hover:scale-105",
          isCurrentUser && "ring-2 ring-accent ring-offset-2 ring-offset-background",
        )}
      >
        {hasCustomAvatar && student.avatarUrl ? (
          <Image
            src={cloudinaryOptimized(student.avatarUrl, "f_auto,q_auto,w_150,h_150,c_fill")}
            alt={`Foto ${student.fullName}`}
            width={150}
            height={150}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface font-display text-2xl font-medium text-muted">
            {getInitials(student.fullName)}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-center gap-1.5">
          <p className="text-sm font-medium text-foreground group-hover:text-accent-text transition-colors">
            {student.fullName}
          </p>
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-1.5">
          {student.absenNumber ? (
            <span className="font-mono text-muted text-xs">No. {student.absenNumber}</span>
          ) : null}
          {isCurrentUser ? (
            <span className="inline-flex items-center rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-semibold text-accent-text">
              Kamu
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {student.slug ? (
        <Link href={`/direktori/${student.slug}`} prefetch={false} className="block cursor-pointer">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}
