"use client";

import { Printer } from "lucide-react";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { StudentGradeTranscriptReport } from "@/components/reports/student-grade-transcript-report";
import { Button } from "@/components/ui/button";
import type { GradeRow } from "@/lib/actions/akademik";

interface StudentGradeModalProps {
  student: {
    fullName: string;
    nis?: string | null;
    absenNumber?: number | null;
  };
  semester: string;
  rows: GradeRow[];
  waliKelasName?: string | null;
}

export function StudentGradeModal({
  student,
  semester,
  rows,
  waliKelasName,
}: StudentGradeModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Kartu Hasil Studi (KHS)"
      modalDescription={`Transkrip nilai rapor hasil belajar mandiri siswa untuk semester ${semester}.`}
      triggerButton={
        <Button variant="outline" size="sm" className="gap-2 cursor-pointer font-medium">
          <Printer className="size-4" />
          <span>Cetak Rapor Nilai (KHS)</span>
        </Button>
      }
    >
      <StudentGradeTranscriptReport
        student={student}
        semester={semester}
        rows={rows}
        waliKelasName={waliKelasName}
      />
    </ReportDialogShell>
  );
}
