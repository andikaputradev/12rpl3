"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

/**
 * Wrapper styling generik di atas react-day-picker v10 (bukan grid kalender
 * manual, sesuai Asumsi Kunci #1 prompt Fase 3) — hanya token warna/spacing
 * Fase 0. Logika indikator event, AnimatePresence transisi bulan, dan locale
 * id ada di komponen fitur AcademicCalendar, bukan di sini, agar primitif
 * ini tetap reusable untuk kebutuhan kalender lain di luar Fase 3.
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3 w-full",
        month_caption: "flex items-center justify-center h-9 relative px-9",
        caption_label: "font-display text-sm font-semibold",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-9 px-0.5",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 p-0 text-muted hover:text-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 p-0 text-muted hover:text-foreground",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex-1 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-muted py-1.5",
        weeks: "flex flex-col gap-0.5 mt-1",
        week: "flex w-full",
        day: "flex-1 aspect-square p-0.5 text-center text-sm relative",
        day_button: cn(
          "size-full min-h-9 rounded-md font-normal transition-colors hover:bg-accent/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent flex flex-col items-center justify-center gap-0.5",
        ),
        today: "[&>button]:font-semibold [&>button]:text-accent-text",
        selected:
          "[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:hover:bg-accent",
        outside: "opacity-40",
        disabled: "opacity-30 pointer-events-none",
        hidden: "invisible",
        footer: "pt-2 text-sm text-muted",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClassName)} {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
