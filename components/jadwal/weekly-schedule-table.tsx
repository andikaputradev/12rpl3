"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScheduleEntry } from "@/lib/actions/jadwal";
import type { DayOfWeek } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<DayOfWeek, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};
const DAYS: DayOfWeek[] = ["senin", "selasa", "rabu", "kamis", "jumat"];
const JS_DAY_TO_DAY_OF_WEEK: Record<number, DayOfWeek | null> = {
  0: null,
  1: "senin",
  2: "selasa",
  3: "rabu",
  4: "kamis",
  5: "jumat",
  6: null,
};

function currentSlot() {
  const now = new Date();
  return {
    day: JS_DAY_TO_DAY_OF_WEEK[now.getDay()] ?? null,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
}

export function WeeklyScheduleTable({ entries }: { entries: ScheduleEntry[] }) {
  // "Sekarang" dihitung di client, bukan dibekukan saat render server -
  // halaman ini bisa berada di cache selama beberapa saat, jam berjalan
  // milik pengunjung yang membacanya, bukan milik waktu server merender.
  const [now, setNow] = useState<{ day: DayOfWeek | null; time: string } | null>(null);

  useEffect(() => {
    setNow(currentSlot());
    const interval = setInterval(() => setNow(currentSlot()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted">
        Jadwal pelajaran belum tersedia.
      </p>
    );
  }

  const periods = [...new Set(entries.map((entry) => entry.periodNumber))].sort((a, b) => a - b);

  function findEntry(day: DayOfWeek, period: number) {
    return entries.find((entry) => entry.dayOfWeek === day && entry.periodNumber === period);
  }

  function isNowCell(day: DayOfWeek, entry: ScheduleEntry | undefined) {
    if (!now?.day || !entry) return false;
    return now.day === day && now.time >= entry.startTime && now.time < entry.endTime;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Jam ke-</TableHead>
          {DAYS.map((day) => (
            <TableHead key={day} scope="col">
              {DAY_LABELS[day]}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {periods.map((period) => (
          <TableRow key={period}>
            <TableCell className="font-mono text-muted text-xs">{period}</TableCell>
            {DAYS.map((day) => {
              const entry = findEntry(day, period);
              const active = isNowCell(day, entry);
              return (
                <TableCell key={day} className={cn(active && "bg-accent/10")}>
                  {entry ? (
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("font-medium", active && "text-accent-text")}>
                        {entry.subjectName ?? <span className="font-normal text-muted">-</span>}
                        {active && <span className="sr-only"> (sedang berlangsung sekarang)</span>}
                      </span>
                      {(entry.teacherName || entry.room) && (
                        <span className="text-muted text-xs">
                          {[entry.teacherName, entry.room].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-muted">
                        {entry.startTime}–{entry.endTime}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
