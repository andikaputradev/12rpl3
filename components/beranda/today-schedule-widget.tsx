"use client";

import { Calendar, Clock, MapPin, Sparkles, User, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PiketDay, ScheduleEntry } from "@/lib/actions/jadwal";
import { EVENT_CATEGORY_COLOR_VAR, EVENT_CATEGORY_LABELS } from "@/lib/config/event-category";
import type { AcademicEvent, DayOfWeek } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface TodayScheduleWidgetProps {
  schedule: ScheduleEntry[];
  piketDays: PiketDay[];
  upcomingEvents: AcademicEvent[];
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "senin", label: "Senin" },
  { key: "selasa", label: "Selasa" },
  { key: "rabu", label: "Rabu" },
  { key: "kamis", label: "Kamis" },
  { key: "jumat", label: "Jumat" },
];

function getInitialDay(): { day: DayOfWeek; isWeekend: boolean } {
  const dayNum = new Date().getDay();
  // 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat
  if (dayNum === 1) return { day: "senin", isWeekend: false };
  if (dayNum === 2) return { day: "selasa", isWeekend: false };
  if (dayNum === 3) return { day: "rabu", isWeekend: false };
  if (dayNum === 4) return { day: "kamis", isWeekend: false };
  if (dayNum === 5) return { day: "jumat", isWeekend: false };
  return { day: "senin", isWeekend: true };
}

export function TodayScheduleWidget({
  schedule,
  piketDays,
  upcomingEvents,
}: TodayScheduleWidgetProps) {
  const initial = useMemo(() => getInitialDay(), []);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initial.day);

  const daySubjects = useMemo(() => {
    return schedule
      .filter((s) => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }, [schedule, selectedDay]);

  const dayPiket = useMemo(() => {
    return piketDays.find((p) => p.dayOfWeek === selectedDay)?.students ?? [];
  }, [piketDays, selectedDay]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Kolom Jadwal Pelajaran (2 Kolom) */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        {/* Day selector tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5 shadow-2xs">
            {DAYS.map(({ key, label }) => {
              const isSelected = selectedDay === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 font-medium text-xs transition-all",
                    isSelected
                      ? "bg-accent font-semibold text-white shadow-xs"
                      : "text-muted hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {label}
                  {key === initial.day && !initial.isWeekend ? (
                    <span className="ml-1.5 inline-block size-1.5 rounded-full bg-emerald-400" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {initial.isWeekend ? (
            <Badge variant="outline" className="text-xs text-muted">
              Menampilkan jadwal hari sekolah berikutnya
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-xs dark:text-emerald-300"
            >
              Hari ini: {DAYS.find((d) => d.key === initial.day)?.label}
            </Badge>
          )}
        </div>

        {/* Schedule List */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-medium text-foreground">
              <Clock className="size-4 text-accent" />
              Mata Pelajaran {DAYS.find((d) => d.key === selectedDay)?.label}
            </h3>
            <span className="font-mono text-xs text-muted">{daySubjects.length} Jam Pelajaran</span>
          </div>

          {daySubjects.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-8 text-center text-muted text-sm">
              Tidak ada jadwal pelajaran untuk hari ini.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {daySubjects.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono font-bold text-accent-text text-xs">
                      {item.periodNumber}
                    </span>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {item.subjectName ?? "Belum ditentukan"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-muted text-xs">
                        {item.teacherName ? (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {item.teacherName}
                          </span>
                        ) : null}
                        {item.room ? (
                          <span className="flex items-center gap-1 font-mono">
                            <MapPin className="size-3" />
                            {item.room}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center sm:self-center">
                    <span className="rounded-md bg-muted/50 px-2.5 py-1 font-mono text-xs text-foreground/80">
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Piket Group of the Selected Day */}
          <div className="mt-5 border-border border-t pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted">
              <Users className="size-3.5 text-accent" />
              <span>Petugas Piket {DAYS.find((d) => d.key === selectedDay)?.label}:</span>
            </div>
            {dayPiket.length === 0 ? (
              <p className="mt-2 text-muted text-xs">Belum ada daftar petugas piket.</p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {dayPiket.map((student) => (
                  <Badge
                    key={student.id}
                    variant="outline"
                    className="gap-1 bg-surface font-normal text-xs"
                  >
                    <span>{student.fullName}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Agenda Terdekat (1 Kolom) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-medium text-foreground">
            <Calendar className="size-4 text-accent" />
            Agenda Terdekat
          </h3>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link href="/jadwal">Selengkapnya →</Link>
          </Button>
        </div>

        <Card className="shadow-xs">
          <CardContent className="p-4">
            {upcomingEvents.length === 0 ? (
              <p className="p-4 text-center text-muted text-sm">Tidak ada agenda mendatang.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {upcomingEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: EVENT_CATEGORY_COLOR_VAR[event.category] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium text-sm text-foreground">
                        {event.title}
                      </p>
                      <p className="font-mono text-[11px] text-muted">
                        {new Intl.DateTimeFormat("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(event.eventDate))}
                      </p>
                      <span className="mt-1 inline-block rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted uppercase">
                        {EVENT_CATEGORY_LABELS[event.category]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Link Card to Full Schedule */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs">
          <div className="flex items-center gap-2 font-medium text-accent-text">
            <Sparkles className="size-4" />
            <span>Kalender Akademik & Jadwal Lengkap</span>
          </div>
          <p className="mt-1.5 text-muted">
            Ingin mengecek jadwal piket lengkap, hari libur, atau waktu ujian semester?
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-3 w-full border-accent/30 text-xs"
          >
            <Link href="/jadwal" prefetch={false}>
              Buka Jadwal & Kalender Akademik
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
