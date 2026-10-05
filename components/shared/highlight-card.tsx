"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import type { BerandaHighlight } from "@/lib/db/schema";
import { cloudinaryOptimized } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function HighlightCard({
  highlight,
  index,
}: {
  highlight: BerandaHighlight;
  index: number;
}) {
  const content = (
    <Card className="group h-full overflow-hidden transition-colors hover:border-accent/50">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        <Image
          src={cloudinaryOptimized(highlight.imageUrl)}
          alt={highlight.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardContent className="flex flex-col gap-1.5 pt-5">
        <CardTitle className="text-base">{highlight.title}</CardTitle>
        <CardDescription>{highlight.description}</CardDescription>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.07 }}
    >
      {highlight.linkHref ? (
        <Link href={highlight.linkHref} prefetch={false} className="cursor-pointer">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}

export function HighlightsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <Sparkles className="size-6 text-muted" aria-hidden="true" />
      <p className="max-w-sm text-sm text-muted">
        Belum ada sorotan kegiatan. Nantikan kabar dari kelas kami di sini.
      </p>
    </div>
  );
}
