import { asc, inArray } from "drizzle-orm";
import { Printer } from "lucide-react";
import type { Metadata } from "next";
import { ReportHubDashboard } from "@/components/reports/report-hub-dashboard";
import { getAttendanceEntrySheet } from "@/lib/actions/admin-akademik";
import { getWaliKelas } from "@/lib/actions/beranda";
import { requireStaffRole } from "@/lib/actions/guard";
import { getClassSchedule, getPiketSchedule, getSubjects } from "@/lib/actions/jadwal";
import { getKasSettings } from "@/lib/actions/kas";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Pusat Dokumen & Cetak Laporan | Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLaporanHubPage() {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  const today = new Date().toISOString().slice(0, 10);

  const [subjects, students, schedule, piket, kasSettings, attendanceSheet, waliKelas] =
    await Promise.all([
      getSubjects(),
      db
        .select()
        .from(profiles)
        .where(inArray(profiles.role, ["siswa", "pengurus"]))
        .orderBy(asc(profiles.absenNumber), asc(profiles.fullName)),
      getClassSchedule(),
      getPiketSchedule(),
      getKasSettings(),
      getAttendanceEntrySheet(today),
      getWaliKelas(),
    ]);

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header className="flex flex-col gap-2">
        <p data-eyebrow>Dashboard Admin</p>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent-text">
            <Printer className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Pusat Cetak Dokumen & Laporan Resmi
            </h1>
            <p className="mt-1 text-sm text-muted">
              Cetak dan ekspor lembar dokumen resmi kelas berstandar dinas pendidikan untuk absensi,
              leger nilai, kas, jadwal, dan kesiswaan.
            </p>
          </div>
        </div>
      </header>

      <ReportHubDashboard
        subjects={subjects}
        students={students}
        schedule={schedule}
        piket={piket}
        kasSettings={kasSettings}
        initialAttendanceSheet={attendanceSheet}
        waliKelas={waliKelas}
      />
    </div>
  );
}
