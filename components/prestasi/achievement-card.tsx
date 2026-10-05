"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Award, Star } from "lucide-react";
import { motion } from "motion/react";
import type { AchievementWithParticipants } from "@/lib/actions/prestasi";
import type { AchievementLevel } from "@/lib/db/schema";

const LEVEL_CONFIG: Record<AchievementLevel, { label: string; tier: number }> = {
  sekolah: { label: "Sekolah", tier: 1 },
  kabupaten: { label: "Kabupaten", tier: 2 },
  provinsi: { label: "Provinsi", tier: 3 },
  nasional: { label: "Nasional", tier: 4 },
  internasional: { label: "Internasional", tier: 5 },
};

function LevelBadge({ level }: { level: AchievementLevel }) {
  const config = LEVEL_CONFIG[level];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent-text uppercase tracking-[0.06em]">
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: config.tier }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: daftar bintang dekoratif statis per tingkat - panjangnya tidak pernah berubah dalam satu render, tidak ada reorder/tambah/hapus.
          <Star key={`star-${level}-${i}`} className="size-2.5 fill-current" />
        ))}
      </span>
      {config.label}
    </span>
  );
}

export function AchievementCard({ achievement }: { achievement: AchievementWithParticipants }) {
  const names = achievement.isClassLevel
    ? "Seluruh Kelas"
    : achievement.participantNames.length === 0
      ? achievement.hiddenParticipantCount > 0
        ? "dan rekan lainnya"
        : "-"
      : achievement.hiddenParticipantCount > 0
        ? `${achievement.participantNames.join(", ")}, dan rekan lainnya`
        : achievement.participantNames.join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent-text">
          <Award className="size-4" aria-hidden="true" />
        </div>
        <LevelBadge level={achievement.level} />
      </div>
      <div>
        <h3 className="font-display font-medium">{achievement.title}</h3>
        {achievement.description ? (
          <p className="mt-1 text-muted text-sm">{achievement.description}</p>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-1 border-border border-t pt-3 text-xs">
        <p className="text-foreground">{names}</p>
        <div className="flex items-center justify-between gap-2 text-muted">
          {achievement.eventDate ? (
            <span className="font-mono">
              {format(achievement.eventDate, "d MMMM yyyy", { locale: idLocale })}
            </span>
          ) : (
            <span />
          )}
          {achievement.certificateUrl ? (
            <a
              href={achievement.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-text underline underline-offset-2 hover:no-underline"
            >
              Lihat sertifikat
            </a>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
