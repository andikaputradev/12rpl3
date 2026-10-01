"use client";

import { useEffect, useState } from "react";
import type { AcademicEvent } from "@/lib/db/schema";
import { getTimeRemaining } from "@/lib/utils";

interface CountdownStatusBarProps {
  event: AcademicEvent | null;
}

const DAY_MS = 86_400_000;

export function CountdownStatusBar({ event }: CountdownStatusBarProps) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, totalMs: 0 });

  useEffect(() => {
    setMounted(true);
    if (!event) return;

    const target = new Date(event.eventDate);

    function tick() {
      setRemaining(getTimeRemaining(target));
    }

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [event]);

  if (!event) return null;

  const showHours = mounted && remaining.totalMs > 0 && remaining.totalMs < DAY_MS;

  return (
    <div
      className="inline-flex w-fit max-w-full items-center gap-3 rounded-full border border-border bg-surface/90 py-2 pr-4 pl-3 backdrop-blur-sm"
      role="status"
      aria-live="off"
    >
      <span className="flex size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
      <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
        T-minus{" "}
        <span className="font-medium text-foreground">{mounted ? remaining.days : "…"}</span> hari
        {showHours ? (
          <>
            {" "}
            <span className="font-medium text-foreground">{remaining.hours}</span> jam
          </>
        ) : null}{" "}
        menuju
      </span>
      <span className="truncate text-sm font-medium text-accent-text">{event.title}</span>
      <span
        className="font-mono text-sm text-accent-text motion-safe:animate-blink"
        aria-hidden="true"
      >
        _
      </span>
    </div>
  );
}
