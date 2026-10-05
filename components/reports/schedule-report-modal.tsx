"use client";

import { Printer } from "lucide-react";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { ScheduleReport } from "@/components/reports/schedule-report";
import { Button } from "@/components/ui/button";
import type { PiketDay, ScheduleEntry } from "@/lib/actions/jadwal";

interface ScheduleReportModalProps {
  schedule: ScheduleEntry[];
  piket: PiketDay[];
  waliKelasName?: string | null;
  ketuaKelasName?: string | null;
  triggerButton?: React.ReactNode;
}

export function ScheduleReportModal({
  schedule,
  piket,
  waliKelasName,
  ketuaKelasName,
  triggerButton,
}: ScheduleReportModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Jadwal Pelajaran & Piket"
      modalDescription="Dokumen resmi jadwal kegiatan belajar mengajar dan pembagian piket kebersihan kelas."
      orientation="landscape"
      triggerButton={
        triggerButton ?? (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer font-medium">
            <Printer className="size-4" />
            <span>Cetak Jadwal & Piket</span>
          </Button>
        )
      }
    >
      <ScheduleReport
        schedule={schedule}
        piket={piket}
        waliKelasName={waliKelasName}
        ketuaKelasName={ketuaKelasName}
      />
    </ReportDialogShell>
  );
}
