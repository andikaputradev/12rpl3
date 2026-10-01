import { eachDayOfInterval, endOfWeek, format, isWeekend, parseISO, startOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceLogEntry } from "@/lib/actions/akademik";
import type { AttendanceStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};

// Warna semata TIDAK menyampaikan makna sendirian: setiap sel punya
// title/aria-label teks lengkap, dan tabel rincian penuh menyusul di bawah.
const STATUS_CLASSNAMES: Record<AttendanceStatus, string> = {
  hadir: "bg-success",
  sakit: "bg-accent",
  izin: "bg-muted",
  alpa: "bg-destructive",
};

export function AttendanceHeatmap({ entries }: { entries: AttendanceLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted text-sm">Belum ada data absensi tercatat.</p>;
  }

  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const timestamps = entries.map((entry) => parseISO(entry.date).getTime());
  const rangeStart = startOfWeek(new Date(Math.min(...timestamps)), { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(new Date(Math.max(...timestamps)), { weekStartsOn: 1 });
  const weekdays = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).filter(
    (day) => !isWeekend(day),
  );

  const weeks: Date[][] = [];
  for (let i = 0; i < weekdays.length; i += 5) {
    weeks.push(weekdays.slice(i, i + 5));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 overflow-x-auto pb-1">
        {weeks.map((week) => (
          <div key={week[0]?.toISOString()} className="flex gap-1.5">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const entry = byDate.get(key);
              const dateLabel = format(day, "EEEE, d MMMM yyyy", { locale: idLocale });
              const label = entry
                ? `${dateLabel}: ${STATUS_LABELS[entry.status]}${entry.notes ? ` — ${entry.notes}` : ""}`
                : `${dateLabel}: tidak ada catatan`;
              return (
                <div
                  key={key}
                  title={label}
                  aria-label={label}
                  role="img"
                  className={cn(
                    "size-5 shrink-0 rounded-[3px] border border-border/60 sm:size-6",
                    entry ? STATUS_CLASSNAMES[entry.status] : "bg-transparent",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-muted uppercase tracking-[0.06em]">
        {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-[2px]", STATUS_CLASSNAMES[status])} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Tanggal</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...entries].reverse().map((entry) => (
            <TableRow key={entry.date}>
              <TableCell>
                {format(parseISO(entry.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
              </TableCell>
              <TableCell>{STATUS_LABELS[entry.status]}</TableCell>
              <TableCell className="text-muted">{entry.notes ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
