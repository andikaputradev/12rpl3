"use client";

import { format, startOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { fetchAcademicEventsForMonth } from "@/lib/actions/jadwal-client";
import { EVENT_CATEGORY_COLOR_VAR, EVENT_CATEGORY_LABELS } from "@/lib/config/event-category";
import type { AcademicEvent } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

interface AcademicCalendarProps {
  initialMonth: Date;
  initialEvents: AcademicEvent[];
}

export function AcademicCalendar({ initialMonth, initialEvents }: AcademicCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(initialMonth));
  const [eventsByMonth, setEventsByMonth] = useState<Record<string, AcademicEvent[]>>(() => ({
    [format(startOfMonth(initialMonth), "yyyy-MM")]: initialEvents,
  }));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const monthKey = format(month, "yyyy-MM");
  const monthEvents = eventsByMonth[monthKey] ?? [];

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AcademicEvent[]>();
    for (const event of monthEvents) {
      const key = dateKey(new Date(event.eventDate));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [monthEvents]);

  function handleMonthChange(next: Date) {
    const normalized = startOfMonth(next);
    const key = format(normalized, "yyyy-MM");
    setMonth(normalized);
    setSelectedDate(undefined);
    if (!(key in eventsByMonth)) {
      startTransition(async () => {
        const fetched = await fetchAcademicEventsForMonth(normalized.toISOString());
        setEventsByMonth((prev) => ({ ...prev, [key]: fetched }));
      });
    }
  }

  const selectedEvents = selectedDate ? (eventsByDate.get(dateKey(selectedDate)) ?? []) : [];

  return (
    <Card className="overflow-hidden p-3 sm:p-5">
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={monthKey}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Calendar
              mode="single"
              locale={idLocale}
              month={month}
              onMonthChange={handleMonthChange}
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn(isPending && "opacity-60 transition-opacity")}
              components={{
                DayButton: ({ day, modifiers: _modifiers, className, children, ...rest }) => {
                  const key = dateKey(day.date);
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const categories = [...new Set(dayEvents.map((event) => event.category))];
                  const dateLabel = format(day.date, "d MMMM yyyy", { locale: idLocale });
                  const label =
                    dayEvents.length > 0
                      ? `${dateLabel}, ${dayEvents.length} agenda: ${categories.map((c) => EVENT_CATEGORY_LABELS[c]).join(", ")}`
                      : dateLabel;
                  return (
                    <button type="button" className={className} aria-label={label} {...rest}>
                      <span>{children}</span>
                      {categories.length > 0 ? (
                        <span className="flex gap-0.5" aria-hidden="true">
                          {categories.slice(0, 3).map((category) => (
                            <span
                              key={category}
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: EVENT_CATEGORY_COLOR_VAR[category] }}
                            />
                          ))}
                        </span>
                      ) : null}
                    </button>
                  );
                },
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {selectedDate && selectedEvents.length > 0 ? (
          <motion.div
            key="event-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-3 border-border border-t pt-4">
              {selectedEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_CATEGORY_COLOR_VAR[event.category] }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-muted text-xs">{EVENT_CATEGORY_LABELS[event.category]}</p>
                    {event.description ? (
                      <p className="mt-1 text-muted text-sm">{event.description}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
