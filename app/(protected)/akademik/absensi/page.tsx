import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { AttendanceHeatmap } from "@/components/akademik/attendance-heatmap";
import { Card, CardContent } from "@/components/ui/card";
import {
  type AttendanceSummary,
  getMyAttendanceLog,
  getMyAttendanceSummary,
} from "@/lib/actions/akademik";
import type { AttendanceStatus } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Absensi",
  robots: { index: false, follow: false },
};

const SUMMARY_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};
const SUMMARY_ORDER: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa"];

export default async function AbsensiPage() {
  let summary: AttendanceSummary;
  let log: Awaited<ReturnType<typeof getMyAttendanceLog>>;
  try {
    [summary, log] = await Promise.all([getMyAttendanceSummary(), getMyAttendanceLog()]);
  } catch {
    forbidden();
  }

  return (
    <div className="container-portal py-16">
      <p data-eyebrow>Akademik</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Absensi</h1>
      <p className="mt-3 text-muted">Rekap kehadiran satu semester — hanya terlihat oleh Anda.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_ORDER.map((status) => (
          <Card key={status}>
            <CardContent className="py-5 text-center">
              <p className="font-display text-3xl font-medium tabular-nums">{summary[status]}</p>
              <p className="mt-1 font-mono text-[11px] text-muted uppercase tracking-[0.08em]">
                {SUMMARY_LABELS[status]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <AttendanceHeatmap entries={log} />
      </div>
    </div>
  );
}
