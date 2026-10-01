import "server-only";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  type AcademicEvent,
  academicEvents,
  classSchedule,
  type DayOfWeek,
  dayOfWeekEnum,
  piketAssignments,
  piketSchedule,
  profiles,
  subjects,
} from "@/lib/db/schema";

export interface ScheduleEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string | null;
  subjectName: string | null;
  teacherName: string | null;
  room: string | null;
}

export const getClassSchedule = cache(
  unstable_cache(
    async (): Promise<ScheduleEntry[]> => {
      try {
        return await db
          .select({
            id: classSchedule.id,
            dayOfWeek: classSchedule.dayOfWeek,
            periodNumber: classSchedule.periodNumber,
            startTime: classSchedule.startTime,
            endTime: classSchedule.endTime,
            subjectId: classSchedule.subjectId,
            subjectName: subjects.name,
            teacherName: classSchedule.teacherName,
            room: classSchedule.room,
          })
          .from(classSchedule)
          .leftJoin(subjects, eq(classSchedule.subjectId, subjects.id))
          .orderBy(asc(classSchedule.periodNumber));
      } catch (error) {
        console.error("[getClassSchedule] Database error:", error);
        return [];
      }
    },
    ["public_class_schedule"],
    { tags: ["class_schedule"], revalidate: 3600 },
  ),
);

export interface PiketDay {
  dayOfWeek: DayOfWeek;
  note: string | null;
  students: { id: string; fullName: string }[];
}

export const getPiketSchedule = cache(
  unstable_cache(
    async (): Promise<PiketDay[]> => {
      try {
        const [schedules, assignments] = await Promise.all([
          db.select().from(piketSchedule),
          db
            .select({
              piketScheduleId: piketAssignments.piketScheduleId,
              studentId: profiles.id,
              fullName: profiles.fullName,
            })
            .from(piketAssignments)
            .innerJoin(profiles, eq(piketAssignments.studentId, profiles.id))
            .orderBy(asc(profiles.displayOrder), asc(profiles.fullName)),
        ]);

        return dayOfWeekEnum.enumValues.map((day) => {
          const schedule = schedules.find((s) => s.dayOfWeek === day);
          const students = schedule
            ? assignments
                .filter((a) => a.piketScheduleId === schedule.id)
                .map((a) => ({ id: a.studentId, fullName: a.fullName }))
            : [];
          return { dayOfWeek: day, note: schedule?.note ?? null, students };
        });
      } catch (error) {
        console.error("[getPiketSchedule] Database error:", error);
        return dayOfWeekEnum.enumValues.map((day) => ({
          dayOfWeek: day,
          note: null,
          students: [],
        }));
      }
    },
    ["public_piket_schedule"],
    { tags: ["piket_schedule"], revalidate: 3600 },
  ),
);

/** Rentang [awal bulan, awal bulan berikutnya) — dipakai populate indikator kalender. */
export async function getAcademicEvents(month: Date): Promise<AcademicEvent[]> {
  try {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);

    return await db
      .select()
      .from(academicEvents)
      .where(and(gte(academicEvents.eventDate, start), lt(academicEvents.eventDate, end)))
      .orderBy(asc(academicEvents.eventDate));
  } catch (error) {
    console.error("[jadwal] events error:", error);
    return [];
  }
}

export const getUpcomingAcademicEvents = cache(
  unstable_cache(
    async (limit = 5): Promise<AcademicEvent[]> => {
      try {
        return await db
          .select()
          .from(academicEvents)
          .where(gte(academicEvents.eventDate, new Date()))
          .orderBy(asc(academicEvents.eventDate))
          .limit(limit);
      } catch (error) {
        console.error("[jadwal] upcoming error:", error);
        return [];
      }
    },
    ["upcoming_academic_events"],
    { tags: ["academic_events"], revalidate: 3600 },
  ),
);

/**
 * Data publik (subjects punya RLS select-public, nama siswa sudah publik
 * lewat Direktori Siswa Fase 2) — dipakai dropdown/multi-select di berbagai
 * halaman admin Fase 3 (ScheduleManager, BulkGradeEntryTable,
 * AssignmentManager, PiketManager) tanpa perlu query terpisah di tiap fitur.
 */
export async function getSubjects(): Promise<{ id: string; name: string }[]> {
  try {
    return await db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .orderBy(asc(subjects.name));
  } catch (error) {
    console.error("[getSubjects] Database error:", error);
    return [];
  }
}

export async function getAllStudents(): Promise<{ id: string; fullName: string }[]> {
  try {
    return await db
      .select({ id: profiles.id, fullName: profiles.fullName })
      .from(profiles)
      .where(inArray(profiles.role, ["siswa", "pengurus"]))
      .orderBy(asc(profiles.absenNumber), asc(profiles.fullName));
  } catch (error) {
    console.error("[getAllStudents] Database error:", error);
    return [];
  }
}
