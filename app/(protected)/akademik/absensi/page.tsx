import { AlertCircle, CheckCircle2, HeartPulse, Info, type UserCheck, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { AttendanceHeatmap } from "@/components/akademik/attendance-heatmap";
import { StudentAttendanceModal } from "@/components/reports/student-attendance-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  type AttendanceSummary,
  getMyAttendanceLog,
  getMyAttendanceSummary,
} from "@/lib/actions/akademik";
import { getWaliKelas } from "@/lib/actions/beranda";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import type { AttendanceStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Absensi",
  robots: { index: false, follow: false },
};

const STATUS_DETAILS: Record<
  AttendanceStatus,
  { label: string; icon: typeof UserCheck; border: string; bg: string; text: string }
> = {
  hadir: {
    label: "Hadir",
    icon: CheckCircle2,
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  sakit: {
    label: "Sakit",
    icon: HeartPulse,
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
  },
  izin: {
    label: "Izin",
    icon: Info,
    border: "border-sky-500/20",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
  },
  alpa: {
    label: "Alpa",
    icon: XCircle,
    border: "border-rose-500/20",
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
  },
};

const SUMMARY_ORDER: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa"];

export default async function AbsensiPage() {
  let summary: AttendanceSummary;
  let log: Awaited<ReturnType<typeof getMyAttendanceLog>>;
  let currentProfile: Awaited<ReturnType<typeof requireAuthenticatedUser>>["profile"];
  let waliKelasName: string | null = null;

  try {
    const [{ profile }, wali, summaryData, logData] = await Promise.all([
      requireAuthenticatedUser(),
      getWaliKelas(),
      getMyAttendanceSummary(),
      getMyAttendanceLog(),
    ]);
    currentProfile = profile;
    waliKelasName = wali?.fullName ?? null;
    summary = summaryData;
    log = logData;
  } catch {
    forbidden();
  }

  const totalRecordedDays = summary.hadir + summary.sakit + summary.izin + summary.alpa;
  const attendanceRate =
    totalRecordedDays > 0 ? Math.round((summary.hadir / totalRecordedDays) * 100) : 100;

  const isEligible = attendanceRate >= 85;

  return (
    <div className="container-portal py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p data-eyebrow>Akademik</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Absensi Saya
          </h1>
          <p className="mt-3 text-muted">
            Rekapitulasi kehadiran pribadi Anda selama satu semester. Data ini hanya dapat dilihat
            oleh Anda dan wali kelas.
          </p>
        </div>

        <div>
          <StudentAttendanceModal
            student={{
              fullName: currentProfile.fullName,
              nis: currentProfile.nis,
              absenNumber: currentProfile.absenNumber,
            }}
            summary={summary}
            log={log}
            waliKelasName={waliKelasName}
          />
        </div>
      </header>

      {/* Attendance Performance Card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                Tingkat Kehadiran
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "font-medium text-xs",
                  isEligible
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                )}
              >
                {isEligible ? "Memenuhi Syarat (>= 85%)" : "Di Bawah Batas Minimal (< 85%)"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold tracking-tight text-foreground">
                {attendanceRate}%
              </span>
              <span className="text-muted text-sm">
                dari total {totalRecordedDays} hari efektif tercatat
              </span>
            </div>
            <p className="text-muted text-xs">
              {isEligible
                ? "Kehadiran Anda sangat baik. Pertahankan terus untuk kelayakan mengikuti asesmen akhir semester dan kelulusan."
                : "Tingkat kehadiran Anda di bawah 85%. Mohon segera berkonsultasi dengan Wali Kelas atau Guru BK untuk bimbingan."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background/80 p-4 text-xs text-muted sm:max-w-xs">
            <AlertCircle className="size-5 shrink-0 text-accent" />
            <span>
              Ada ketidaksesuaian data? Silakan hubungi Sekretaris Kelas atau Wali Kelas untuk
              verifikasi.
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_ORDER.map((status) => {
          const conf = STATUS_DETAILS[status];
          const Icon = conf.icon;
          const count = summary[status];
          const pct = totalRecordedDays > 0 ? Math.round((count / totalRecordedDays) * 100) : 0;

          return (
            <Card key={status} className={cn("transition-all hover:border-accent/40", conf.border)}>
              <CardContent className="flex flex-col items-center justify-center p-5 text-center">
                <div
                  className={cn(
                    "mb-2 flex size-10 items-center justify-center rounded-full",
                    conf.bg,
                  )}
                >
                  <Icon className={cn("size-5", conf.text)} />
                </div>
                <p className="font-display text-3xl font-bold tabular-nums text-foreground">
                  {count}
                </p>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                  <span>{conf.label}</span>
                  <span>·</span>
                  <span>{pct}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Heatmap */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-tight">Riwayat Harian</h2>
          <span className="text-muted text-xs">
            Arahkan kursor atau ketuk kotak untuk melihat detail
          </span>
        </div>
        <AttendanceHeatmap entries={log} />
      </div>
    </div>
  );
}
