"use client";

import { Printer } from "lucide-react";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { StudentAttendanceReport } from "@/components/reports/student-attendance-report";
import { Button } from "@/components/ui/button";
import type { AttendanceLogEntry, AttendanceSummary } from "@/lib/actions/akademik";

interface StudentAttendanceModalProps {
  student: {
    fullName: string;
    nis?: string | null;
    absenNumber?: number | null;
  };
  summary: AttendanceSummary;
  log: AttendanceLogEntry[];
  waliKelasName?: string | null;
}

export function StudentAttendanceModal({
  student,
  summary,
  log,
  waliKelasName,
}: StudentAttendanceModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Lembar Kehadiran Siswa"
      modalDescription="Rekapitulasi kehadiran dan kedisiplinan pribadi siswa selama semester berjalan."
      triggerButton={
        <Button variant="outline" size="sm" className="gap-2 cursor-pointer font-medium">
          <Printer className="size-4" />
          <span>Cetak Lembar Kehadiran</span>
        </Button>
      }
    >
      <StudentAttendanceReport
        student={student}
        summary={summary}
        log={log}
        waliKelasName={waliKelasName}
      />
    </ReportDialogShell>
  );
}
