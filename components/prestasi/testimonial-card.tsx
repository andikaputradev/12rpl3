"use client";

import { Quote } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import type { TestimonialView } from "@/lib/actions/prestasi";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

export function TestimonialCard({ testimonial }: { testimonial: TestimonialView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6"
    >
      <Quote className="size-5 text-accent-text" aria-hidden="true" />
      <p className="text-sm leading-relaxed">{testimonial.quote}</p>
      <div className="mt-auto flex items-center gap-3 border-border border-t pt-4">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-background">
          {testimonial.photoUrl ? (
            <Image
              src={cloudinaryOptimized(testimonial.photoUrl, "f_auto,q_auto,w_80,h_80,c_fill")}
              alt={`Foto ${testimonial.name}`}
              width={40}
              height={40}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-display text-muted text-xs">
              {getInitials(testimonial.name)}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{testimonial.name}</p>
          {testimonial.contextNote ? (
            <p className="text-muted text-xs">{testimonial.contextNote}</p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
