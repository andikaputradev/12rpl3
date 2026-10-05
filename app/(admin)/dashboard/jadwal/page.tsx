import type { Metadata } from "next";
import { EventsManager } from "@/components/admin/events-manager";
import { PiketManager } from "@/components/admin/piket-manager";
import { ScheduleManager } from "@/components/admin/schedule-manager";
import { SubjectManagerDialog } from "@/components/admin/subject-manager-dialog";
import { ScheduleReportModal } from "@/components/reports/schedule-report-modal";
import { getAllAcademicEvents, getWaliKelas } from "@/lib/actions/beranda";
import {
  getAllStudents,
  getClassSchedule,
  getPiketSchedule,
  getSubjects,
} from "@/lib/actions/jadwal";

export const metadata: Metadata = {
  title: "Jadwal & Agenda - Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminJadwalPage() {
  const [schedule, piketDays, subjects, students, events, waliKelas] = await Promise.all([
    getClassSchedule(),
    getPiketSchedule(),
    getSubjects(),
    getAllStudents(),
    getAllAcademicEvents(),
    getWaliKelas(),
  ]);

  return (
    <div className="container-portal flex flex-col gap-10 py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p data-eyebrow>Dashboard Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Kelola Jadwal & Agenda
          </h1>
          <p className="mt-1 max-w-2xl text-muted text-sm">
            Perubahan langsung tampil di halaman Jadwal & Agenda publik setelah disimpan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScheduleReportModal
            schedule={schedule}
            piket={piketDays}
            waliKelasName={waliKelas?.fullName}
          />
          <SubjectManagerDialog subjects={subjects} />
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium">Jadwal Pelajaran</h2>
        <ScheduleManager entries={schedule} subjects={subjects} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium">Jadwal Piket</h2>
        <PiketManager piketDays={piketDays} students={students} />
      </section>

      <EventsManager events={events} />
    </div>
  );
}
