"use client";

import { ArrowRight, Images } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import type { AcademicEvent, ClassProfile } from "@/lib/db/schema";
import { CountdownStatusBar } from "./countdown-status-bar";

interface HeroProps {
  classProfile: ClassProfile | null;
  featuredEvent: AcademicEvent | null;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Hero({ classProfile, featuredEvent }: HeroProps) {
  const tahunAjaran = classProfile?.tahunAjaran;
  const eyebrow = `${siteConfig.className} · ${siteConfig.schoolName}${tahunAjaran ? ` · ${tahunAjaran}` : ""}`;
  const headline = classProfile?.motto ?? siteConfig.tagline;

  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden">
      <Image
        src={siteConfig.heroBackgroundUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-background/85 dark:bg-background/60" aria-hidden="true" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container-portal relative z-10 flex flex-col items-start gap-6 py-24"
      >
        <motion.div variants={item}>
          <span data-eyebrow>{eyebrow}</span>
        </motion.div>

        <motion.h1
          variants={item}
          className="max-w-2xl text-balance font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl"
        >
          {headline}
        </motion.h1>

        <motion.div variants={item} className="flex flex-wrap items-center gap-3 pt-1">
          <Button asChild>
            <Link href="/profil" prefetch={false}>
              Profil Kelas
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/galeri" prefetch={false} className="inline-flex items-center gap-2">
              <Images className="size-4" />
              Jelajahi Galeri
            </Link>
          </Button>
        </motion.div>

        {featuredEvent ? (
          <motion.div variants={item} className="pt-3">
            <CountdownStatusBar event={featuredEvent} />
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
