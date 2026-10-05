"use client";

import { Printer } from "lucide-react";
import { KasReport } from "@/components/reports/kas-report";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { Button } from "@/components/ui/button";
import type { KasSettings } from "@/lib/db/schema";

interface KasReportModalProps {
  settings: KasSettings | null;
  waliKelasName?: string | null;
  bendaharaName?: string | null;
  triggerButton?: React.ReactNode;
}

export function KasReportModal({
  settings,
  waliKelasName,
  bendaharaName,
  triggerButton,
}: KasReportModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Laporan Kas Digital"
      modalDescription="Dokumen informasi rekening dan tata kelola iuran kas kelas XII RPL 3."
      triggerButton={
        triggerButton ?? (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer font-medium">
            <Printer className="size-4" />
            <span>Cetak Laporan Kas</span>
          </Button>
        )
      }
    >
      <KasReport settings={settings} waliKelasName={waliKelasName} bendaharaName={bendaharaName} />
    </ReportDialogShell>
  );
}
