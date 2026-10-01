"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";

interface StatCounterProps {
  value: number;
  label: string;
  format?: "standard" | "compact";
}

function formatValue(value: number, format: "standard" | "compact") {
  return new Intl.NumberFormat("id-ID", {
    notation: format === "compact" ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function StatCounter({ value, label, format = "standard" }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => formatValue(Math.round(latest), format));

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      count.set(value);
      return;
    }

    const controls = animate(count, value, { duration: 1.3, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [isInView, value, prefersReducedMotion, count]);

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <motion.span className="font-display text-4xl font-medium tabular-nums sm:text-5xl">
        {display}
      </motion.span>
      <span data-eyebrow>{label}</span>
    </div>
  );
}
