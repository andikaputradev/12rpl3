import type { Metadata } from "next";
import { Suspense } from "react";
import { AcademicCalendar } from "@/components/jadwal/academic-calendar";
import { AssignmentReminderStrip } from "@/components/jadwal/assignment-reminder-strip";
import { PiketCard } from "@/components/jadwal/piket-card";
import { UpcomingEventsList } from "@/components/jadwal/upcoming-events-list";
import { WeeklyScheduleTable } from "@/components/jadwal/weekly-schedule-table";
import {
  getAcademicEvents,
  getClassSchedule,
  getPiketSchedule,
  getUpcomingAcademicEvents,
} from "@/lib/actions/jadwal";

export const metadata: Metadata = {
  title: "Jadwal & Agenda",
  description: "Jadwal pelajaran mingguan, jadwal piket, dan kalender akademik Kelas XII RPL 3.",
};

export default async function JadwalPage() {
  const currentMonth = new Date();
  const [schedule, piketDays, monthEvents, upcomingEvents] = await Promise.all([
    getClassSchedule(),
    getPiketSchedule(),
    getAcademicEvents(currentMonth),
    getUpcomingAcademicEvents(6),
  ]);

  return (
    <div className="flex flex-col">
      <section className="container-portal py-16 sm:py-20">
        <p data-eyebrow>Jadwal & Agenda</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Rencana Belajar Kelas
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Jadwal pelajaran mingguan, giliran piket harian, dan kalender akademik satu tahun ajaran.
        </p>

        <Suspense fallback={null}>
          <div className="mt-8">
            <AssignmentReminderStrip />
          </div>
        </Suspense>
      </section>

      <section className="container-portal pb-16">
        <h2 className="font-display text-2xl font-medium tracking-tight">Jadwal Pelajaran</h2>
        <div className="mt-6">
          <WeeklyScheduleTable entries={schedule} />
        </div>
      </section>

      <section className="container-portal pb-16">
        <h2 className="font-display text-2xl font-medium tracking-tight">Jadwal Piket</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {piketDays.map((day) => (
            <PiketCard key={day.dayOfWeek} day={day} />
          ))}
        </div>
      </section>

      <section className="container-portal pb-20">
        <h2 className="font-display text-2xl font-medium tracking-tight">Kalender Akademik</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <AcademicCalendar initialMonth={currentMonth} initialEvents={monthEvents} />
          <UpcomingEventsList events={upcomingEvents} />
        </div>
      </section>
    </div>
  );
}
