"use client";

import { Printer } from "lucide-react";
import { ReportDialogShell } from "@/components/reports/report-dialog-shell";
import { StudentDirectoryReport } from "@/components/reports/student-directory-report";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/db/schema";

interface StudentDirectoryModalProps {
  students: Profile[];
  waliKelasName?: string | null;
  ketuaKelasName?: string | null;
  triggerButton?: React.ReactNode;
}

export function StudentDirectoryModal({
  students,
  waliKelasName,
  ketuaKelasName,
  triggerButton,
}: StudentDirectoryModalProps) {
  return (
    <ReportDialogShell
      modalTitle="Cetak Direktori Siswa Kelas"
      modalDescription={`Daftar nomor urut absen, NIS, dan biodata resmi ${students.length} siswa kelas XII RPL 3.`}
      triggerButton={
        triggerButton ?? (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer font-medium">
            <Printer className="size-4" />
            <span>Cetak Direktori Siswa</span>
          </Button>
        )
      }
    >
      <StudentDirectoryReport
        students={students}
        waliKelasName={waliKelasName}
        ketuaKelasName={ketuaKelasName}
      />
    </ReportDialogShell>
  );
}
