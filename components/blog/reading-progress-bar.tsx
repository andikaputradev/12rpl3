"use client";

import { motion, useScroll, useTransform } from "motion/react";

/** aria-hidden - dekoratif-informatif tambahan, tidak menggantikan navigasi fungsional apa pun (Bagian 11 brief). */
export function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-accent"
      style={{ width }}
    />
  );
}
