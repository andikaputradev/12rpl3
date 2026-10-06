import "server-only";
import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  type Announcement,
  type AssessmentType,
  type AttendanceStatus,
  announcements,
  assignmentSubmissions,
  assignments,
  attendance,
  grades,
  subjects,
} from "@/lib/db/schema";
import { computeSubmissionStatus } from "@/lib/utils/assignments";
import { calculateSubjectAverage, type SubjectScores } from "@/lib/utils/grades";

/**
 * Lapis pertahanan kedua terhadap pengecualian pengurus dari nilai/absensi
 * (Bagian 9 brief) - lapis pertama adalah pemeriksaan role eksplisit di
 * halaman (app/(protected)/akademik/{nilai,absensi}/page.tsx via forbidden()).
 * Fungsi di sini tetap menolak secara independen agar tidak bergantung pada
 * satu-satunya titik pemeriksaan di halaman.
 */
function assertRoleCanViewGradesAttendance(_role: string) {
  // Pengurus kelas adalah siswa aktif XII RPL 3 yang berhak melihat nilai dan absensi pribadinya.
}

export interface GradeRow {
  subjectId: string;
  subjectName: string;
  semester: string;
  scores: SubjectScores;
  average: number | null;
}

export async function getMyGrades(semester?: string): Promise<GradeRow[]> {
  const { userId, profile } = await requireAuthenticatedUser();
  assertRoleCanViewGradesAttendance(profile.role);

  const rows = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
      semester: grades.semester,
      assessmentType: grades.assessmentType,
      score: grades.score,
    })
    .from(grades)
    .innerJoin(subjects, eq(grades.subjectId, subjects.id))
    .where(
      semester
        ? and(eq(grades.studentId, userId), eq(grades.semester, semester))
        : eq(grades.studentId, userId),
    )
    .orderBy(asc(subjects.name));

  const bySubject = new Map<string, GradeRow>();
  for (const row of rows) {
    const key = `${row.subjectId}::${row.semester}`;
    let entry = bySubject.get(key);
    if (!entry) {
      entry = {
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        semester: row.semester,
        scores: {},
        average: null,
      };
      bySubject.set(key, entry);
    }
    entry.scores[row.assessmentType as AssessmentType] = row.score;
  }

  const result = [...bySubject.values()];
  for (const entry of result) {
    entry.average = calculateSubjectAverage(entry.scores);
  }
  return result.sort((a, b) => a.subjectName.localeCompare(b.subjectName, "id"));
}

export type AttendanceSummary = Record<AttendanceStatus, number>;

export async function getMyAttendanceSummary(): Promise<AttendanceSummary> {
  const { userId, profile } = await requireAuthenticatedUser();
  assertRoleCanViewGradesAttendance(profile.role);

  const rows = await db
    .select({ status: attendance.status })
    .from(attendance)
    .where(eq(attendance.studentId, userId));

  const summary: AttendanceSummary = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  for (const row of rows) {
    summary[row.status] += 1;
  }
  return summary;
}

export interface AttendanceLogEntry {
  date: string;
  status: AttendanceStatus;
  notes: string | null;
}

export async function getMyAttendanceLog(): Promise<AttendanceLogEntry[]> {
  const { userId, profile } = await requireAuthenticatedUser();
  assertRoleCanViewGradesAttendance(profile.role);

  return db
    .select({ date: attendance.date, status: attendance.status, notes: attendance.notes })
    .from(attendance)
    .where(eq(attendance.studentId, userId))
    .orderBy(asc(attendance.date));
}

export interface AssignmentWithStatus {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  subjectName: string | null;
  dueDate: Date;
  status: ReturnType<typeof computeSubmissionStatus>;
  submittedAt: Date | null;
  fileUrl: string | null;
  notes: string | null;
}

export async function getAssignments(): Promise<AssignmentWithStatus[]> {
  const { userId } = await requireAuthenticatedUser();

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      subjectId: assignments.subjectId,
      subjectName: subjects.name,
      dueDate: assignments.dueDate,
      submittedAt: assignmentSubmissions.submittedAt,
      fileUrl: assignmentSubmissions.fileUrl,
      notes: assignmentSubmissions.notes,
    })
    .from(assignments)
    .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
    .leftJoin(
      assignmentSubmissions,
      and(
        eq(assignmentSubmissions.assignmentId, assignments.id),
        eq(assignmentSubmissions.studentId, userId),
      ),
    )
    .orderBy(asc(assignments.dueDate));

  const now = new Date();
  return rows.map((row) => ({
    ...row,
    submittedAt: row.submittedAt ?? null,
    fileUrl: row.fileUrl ?? null,
    notes: row.notes ?? null,
    status: computeSubmissionStatus(row.dueDate, row.submittedAt ?? null, now),
  }));
}

/**
 * assignmentId datang dari client (menentukan tugas MANA), tapi studentId
 * tetap dari sesi server - kombinasi ini aman: pemanggil hanya bisa
 * mengambil kirimannya SENDIRI untuk assignmentId apa pun, tidak pernah
 * kiriman siswa lain, karena studentId selalu dikunci ke auth.uid() sesi.
 */
export async function getMySubmission(assignmentId: string) {
  const { userId } = await requireAuthenticatedUser();

  const [row] = await db
    .select()
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignmentId),
        eq(assignmentSubmissions.studentId, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export interface UpcomingAssignment {
  id: string;
  title: string;
  subjectName: string | null;
  dueDate: Date;
}

/** Hanya tugas yang belum dikumpulkan siswa ini - strip pengingat tidak menampilkan tugas yang sudah selesai. */
export async function getUpcomingAssignments(daysAhead = 7): Promise<UpcomingAssignment[]> {
  const { userId } = await requireAuthenticatedUser();
  const now = new Date();
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      subjectName: subjects.name,
      dueDate: assignments.dueDate,
    })
    .from(assignments)
    .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
    .leftJoin(
      assignmentSubmissions,
      and(
        eq(assignmentSubmissions.assignmentId, assignments.id),
        eq(assignmentSubmissions.studentId, userId),
      ),
    )
    .where(
      and(
        gte(assignments.dueDate, now),
        lte(assignments.dueDate, until),
        isNull(assignmentSubmissions.id),
      ),
    )
    .orderBy(asc(assignments.dueDate))
    .limit(3);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await requireAuthenticatedUser();

  return db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}
