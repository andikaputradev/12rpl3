"use client";

import { Printer } from "lucide-react";
import { DailyAttendanceReport } from "@/components/reports/daily-attendance-report";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { Button } from "@/components/ui/button";
import type { AttendanceEntryRow } from "@/lib/actions/admin-akademik";
import type { AttendanceStatus } from "@/lib/db/schema";

interface AttendanceReportModalProps {
  date: string;
  sheet: AttendanceEntryRow[];
  statuses: Record<string, AttendanceStatus>;
  waliKelasName?: string | null;
  triggerButton?: React.ReactNode;
}

export function AttendanceReportModal({
  date,
  sheet,
  statuses,
  waliKelasName,
  triggerButton,
}: AttendanceReportModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Rekap Presensi Siswa"
      modalDescription={`Lembar absensi harian kelas XII RPL 3 untuk tanggal ${date}.`}
      triggerButton={
        triggerButton ?? (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <Printer className="size-4" />
            <span>Cetak Presensi</span>
          </Button>
        )
      }
    >
      <DailyAttendanceReport
        date={date}
        sheet={sheet}
        statuses={statuses}
        waliKelasName={waliKelasName}
      />
    </ReportDialogShell>
  );
}
