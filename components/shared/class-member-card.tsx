"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { StudentListItem } from "@/lib/actions/direktori";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

/**
 * whileInView dipasang PER KARTU (bukan satu container stagger untuk
 * seluruh grid) - setiap kartu memicu animasinya sendiri persis saat kartu
 * itu memasuki viewport, mengikuti kecepatan scroll pengguna secara alami.
 * Untuk grid puluhan siswa, satu stagger container tunggal akan menghitung
 * delay dari satu titik pemicu di awal, membuat kartu jauh di bawah "meledak"
 * bersamaan begitu ikut ter-mount, bukan reveal yang terasa alami.
 */
export function ClassMemberCard({ student }: { student: StudentListItem }) {
  const content = (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <div className="relative size-[150px] overflow-hidden rounded-full border border-border bg-surface">
        {student.avatarUrl ? (
          <Image
            src={cloudinaryOptimized(student.avatarUrl, "f_auto,q_auto,w_150,h_150,c_fill")}
            alt={`Foto ${student.fullName}`}
            width={150}
            height={150}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-2xl text-muted">
            {getInitials(student.fullName)}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{student.fullName}</p>
        {student.absenNumber ? (
          <p className="font-mono text-muted text-xs">No. {student.absenNumber}</p>
        ) : null}
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
        <Link href={`/direktori/${student.slug}`} className="block cursor-pointer">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}
