"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import type { GuestbookEntryDisplay } from "@/lib/actions/interaksi";
import { getInitials } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

interface GuestbookWallProps {
  entries: GuestbookEntryDisplay[];
}

export function GuestbookWall({ entries }: GuestbookWallProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-border border-dashed bg-surface/50 px-4 py-10 text-center text-muted text-sm">
        Belum ada pesan. Jadilah yang pertama mengisi buku tamu ini.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          variants={cardVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: (index % 9) * 0.05 }}
        >
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/12 font-display text-accent-text text-xs">
                  {getInitials(entry.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{entry.name}</p>
                  <p className="font-mono text-[11px] text-muted">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
                      new Date(entry.createdAt),
                    )}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-foreground/90 text-sm leading-relaxed">
                {entry.message}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
