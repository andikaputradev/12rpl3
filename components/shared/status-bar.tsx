"use client";

import { useEffect, useState } from "react";
import { getProgressPercent, getTimeRemaining } from "@/lib/utils";

interface StatusBarProps {
  targetDate: string | null;
  startDate: string | null;
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-2xl font-medium tabular-nums sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</span>
    </div>
  );
}

export function StatusBar({ targetDate, startDate }: StatusBarProps) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!targetDate) return;

    const target = new Date(targetDate);
    const start = startDate ? new Date(startDate) : new Date(target.getTime() - 365 * 86_400_000);

    function tick() {
      setRemaining(getTimeRemaining(target));
      setProgress(getProgressPercent(start, target));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate, startDate]);

  return (
    <div
      className="w-full max-w-lg rounded-lg border border-border bg-surface/90 px-5 py-4 backdrop-blur-sm"
      role="status"
      aria-live="off"
    >
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-success" aria-hidden="true" />
        <span data-eyebrow>Countdown Kelulusan</span>
        <span
          className="font-mono text-sm text-accent-text motion-safe:animate-blink"
          aria-hidden="true"
        >
          _
        </span>
      </div>

      {targetDate ? (
        <>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <Digit value={mounted ? remaining.days : 0} label="Hari" />
            <Digit value={mounted ? remaining.hours : 0} label="Jam" />
            <Digit value={mounted ? remaining.minutes : 0} label="Menit" />
            <Digit value={mounted ? remaining.seconds : 0} label="Detik" />
          </div>

          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
              style={{ width: `${mounted ? progress : 0}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-3 font-mono text-xs text-muted">
          Menunggu tanggal ujian/kelulusan resmi dikonfirmasi sekolah.
        </p>
      )}
    </div>
  );
}
