"use client";

import { Printer } from "lucide-react";
import { GradeLegerReport } from "@/components/reports/grade-leger-report";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { Button } from "@/components/ui/button";
import type { GradeEntryRow } from "@/lib/actions/admin-akademik";
import type { AssessmentType } from "@/lib/db/schema";

interface GradeReportModalProps {
  subjectName: string;
  semester: string;
  activeAssessmentType?: AssessmentType;
  sheet: GradeEntryRow[];
  scores: Record<string, string>;
  waliKelasName?: string | null;
  teacherName?: string | null;
  triggerButton?: React.ReactNode;
}

export function GradeReportModal({
  subjectName,
  semester,
  activeAssessmentType,
  sheet,
  scores,
  waliKelasName,
  teacherName,
  triggerButton,
}: GradeReportModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Leger Nilai Mata Pelajaran"
      modalDescription={`Rekapitulasi nilai hasil belajar siswa kelas XII RPL 3 - ${subjectName} (${semester}).`}
      triggerButton={
        triggerButton ?? (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <Printer className="size-4" />
            <span>Cetak Leger Nilai</span>
          </Button>
        )
      }
    >
      <GradeLegerReport
        subjectName={subjectName}
        semester={semester}
        activeAssessmentType={activeAssessmentType}
        sheet={sheet}
        scores={scores}
        waliKelasName={waliKelasName}
        teacherName={teacherName}
      />
    </ReportDialogShell>
  );
}
