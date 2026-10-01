"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion, useReducedMotion } from "motion/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const prefersReducedMotion = useReducedMotion();
  const ratio = (value ?? 0) / 100;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted/30", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild data-slot="progress-indicator">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-accent"
          initial={false}
          animate={{ scaleX: ratio }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
