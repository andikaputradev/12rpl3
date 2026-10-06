import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  type AssessmentType,
  type Assignment,
  type AttendanceStatus,
  assignmentSubmissions,
  assignments,
  attendance,
  auditLog,
  grades,
  profiles,
  subjects,
} from "@/lib/db/schema";

/**
 * Daftar tugas mentah (tanpa join status per-siswa) - untuk AssignmentManager
 * di dashboard admin. Berbeda dari getAssignments() di akademik.ts, yang
 * sengaja join ke kiriman MILIK PEMANGGIL (tidak relevan untuk staf, yang
 * bukan siswa dan tidak seharusnya "mengumpulkan" tugas).
 */
export async function getAllAssignments(): Promise<Assignment[]> {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  return db.select().from(assignments).orderBy(desc(assignments.dueDate));
}

export interface AssignmentSubmissionDetail {
  id: string;
  studentId: string;
  studentName: string;
  absenNumber: number | null;
  fileUrl: string;
  notes: string | null;
  submittedAt: Date;
  reviewedByStaff: boolean;
}

export interface StudentWithoutSubmission {
  id: string;
  fullName: string;
  absenNumber: number | null;
}

export interface AssignmentWithSubmissions {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  subjectName: string | null;
  dueDate: Date;
  createdAt: Date;
  totalSubmissions: number;
  totalStudents: number;
  submissions: AssignmentSubmissionDetail[];
  pendingStudents: StudentWithoutSubmission[];
}

export async function getAllAssignmentsWithSubmissions(): Promise<AssignmentWithSubmissions[]> {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  const [allAssignmentsList, allStudents, allSubmissions] = await Promise.all([
    db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        subjectId: assignments.subjectId,
        subjectName: subjects.name,
        dueDate: assignments.dueDate,
        createdAt: assignments.createdAt,
      })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .orderBy(desc(assignments.dueDate)),
    db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        absenNumber: profiles.absenNumber,
      })
      .from(profiles)
      .where(inArray(profiles.role, ["siswa", "pengurus"]))
      .orderBy(asc(profiles.absenNumber), asc(profiles.fullName)),
    db
      .select({
        id: assignmentSubmissions.id,
        assignmentId: assignmentSubmissions.assignmentId,
        studentId: assignmentSubmissions.studentId,
        fileUrl: assignmentSubmissions.fileUrl,
        notes: assignmentSubmissions.notes,
        submittedAt: assignmentSubmissions.submittedAt,
        reviewedByStaff: assignmentSubmissions.reviewedByStaff,
        studentName: profiles.fullName,
        absenNumber: profiles.absenNumber,
      })
      .from(assignmentSubmissions)
      .innerJoin(profiles, eq(assignmentSubmissions.studentId, profiles.id))
      .orderBy(asc(profiles.absenNumber), desc(assignmentSubmissions.submittedAt)),
  ]);

  const submissionsByAssignment = new Map<string, AssignmentSubmissionDetail[]>();
  for (const sub of allSubmissions) {
    const list = submissionsByAssignment.get(sub.assignmentId) ?? [];
    list.push({
      id: sub.id,
      studentId: sub.studentId,
      studentName: sub.studentName,
      absenNumber: sub.absenNumber,
      fileUrl: sub.fileUrl,
      notes: sub.notes,
      submittedAt: sub.submittedAt,
      reviewedByStaff: sub.reviewedByStaff,
    });
    submissionsByAssignment.set(sub.assignmentId, list);
  }

  return allAssignmentsList.map((assignment) => {
    const submissions = submissionsByAssignment.get(assignment.id) ?? [];
    const submittedStudentIds = new Set(submissions.map((s) => s.studentId));
    const pendingStudents = allStudents.filter((student) => !submittedStudentIds.has(student.id));

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subjectId: assignment.subjectId,
      subjectName: assignment.subjectName,
      dueDate: assignment.dueDate,
      createdAt: assignment.createdAt,
      totalSubmissions: submissions.length,
      totalStudents: allStudents.length,
      submissions,
      pendingStudents,
    };
  });
}

export interface GradeEntryRow {
  studentId: string;
  fullName: string;
  absenNumber: number | null;
  existingScore: number | null;
}

export async function getGradeEntrySheet(
  subjectId: string,
  assessmentType: AssessmentType,
  semester: string,
): Promise<GradeEntryRow[]> {
  await requireStaffRole(["super_admin", "wali_kelas"]);

  const [students, existing] = await Promise.all([
    db
      .select({ id: profiles.id, fullName: profiles.fullName, absenNumber: profiles.absenNumber })
      .from(profiles)
      .where(inArray(profiles.role, ["siswa", "pengurus"]))
      .orderBy(asc(profiles.absenNumber), asc(profiles.fullName)),
    db
      .select({ studentId: grades.studentId, score: grades.score })
      .from(grades)
      .where(
        and(
          eq(grades.subjectId, subjectId),
          eq(grades.assessmentType, assessmentType),
          eq(grades.semester, semester),
        ),
      ),
  ]);

  const scoreByStudent = new Map(existing.map((row) => [row.studentId, row.score]));

  return students.map((student) => ({
    studentId: student.id,
    fullName: student.fullName,
    absenNumber: student.absenNumber,
    existingScore: scoreByStudent.get(student.id) ?? null,
  }));
}

export interface AttendanceEntryRow {
  studentId: string;
  fullName: string;
  absenNumber: number | null;
  existingStatus: AttendanceStatus | null;
}

/**
 * existingStatus null berarti "belum direkam untuk tanggal ini" - UI (bukan
 * fungsi ini) yang memutuskan menampilkannya sebagai default "Hadir" pada
 * ToggleGroup, konsisten dengan Bagian 7 brief: "staf tinggal mengubah baris
 * yang tidak hadir". Data sesungguhnya di database tetap jujur (null),
 * bukan diam-diam ditulis "hadir" sebelum staf benar-benar menyimpan.
 */
export async function getAttendanceEntrySheet(date: string): Promise<AttendanceEntryRow[]> {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  const [students, existing] = await Promise.all([
    db
      .select({ id: profiles.id, fullName: profiles.fullName, absenNumber: profiles.absenNumber })
      .from(profiles)
      .where(inArray(profiles.role, ["siswa", "pengurus"]))
      .orderBy(asc(profiles.absenNumber), asc(profiles.fullName)),
    db
      .select({ studentId: attendance.studentId, status: attendance.status })
      .from(attendance)
      .where(eq(attendance.date, date)),
  ]);

  const statusByStudent = new Map(existing.map((row) => [row.studentId, row.status]));

  return students.map((student) => ({
    studentId: student.id,
    fullName: student.fullName,
    absenNumber: student.absenNumber,
    existingStatus: statusByStudent.get(student.id) ?? null,
  }));
}

export interface AuditLogEntryView {
  id: string;
  actorName: string | null;
  action: string;
  tableName: string;
  studentName: string | null;
  before: unknown;
  after: unknown;
  createdAt: Date;
}

/**
 * super_admin SAJA - brief Bagian 7 eksplisit mengecualikan wali_kelas dari
 * halaman ini, berbeda dari pola staf dua-role di seluruh fase ini. Audit
 * log adalah mekanisme akuntabilitas yang mengawasi tindakan wali_kelas itu
 * sendiri (Bagian 7: "melindungi baik siswa maupun Wali Kelas dari
 * sengketa"), sehingga wali_kelas tidak diberi akses melihatnya sendiri.
 */
export async function getGradeAttendanceAuditLog(limit = 50): Promise<AuditLogEntryView[]> {
  await requireStaffRole(["super_admin"]);

  const [rows, students] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        actorName: profiles.fullName,
        action: auditLog.action,
        tableName: auditLog.tableName,
        before: auditLog.before,
        after: auditLog.after,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(profiles, eq(auditLog.actorId, profiles.id))
      .where(inArray(auditLog.tableName, ["grades", "attendance"]))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit),
    db
      .select({ id: profiles.id, fullName: profiles.fullName })
      .from(profiles)
      .where(inArray(profiles.role, ["siswa", "pengurus"])),
  ]);

  const studentNameById = new Map(students.map((student) => [student.id, student.fullName]));

  return rows.map((row) => {
    const snapshot = (row.after ?? row.before) as { studentId?: string } | null;
    const studentId = snapshot?.studentId;
    return {
      id: row.id,
      actorName: row.actorName,
      action: row.action,
      tableName: row.tableName,
      studentName: studentId ? (studentNameById.get(studentId) ?? "Siswa tidak dikenal") : null,
      before: row.before,
      after: row.after,
      createdAt: row.createdAt,
    };
  });
}
