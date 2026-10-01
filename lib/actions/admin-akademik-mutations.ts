"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  announcements,
  assignments,
  attendance,
  auditLog,
  grades,
  subjects,
} from "@/lib/db/schema";
import { sanitizeUserText } from "@/lib/utils";
import {
  type AnnouncementFormInput,
  type AssignmentFormInput,
  announcementSchema,
  assignmentSchema,
  type BulkUpsertAttendanceInput,
  type BulkUpsertGradesInput,
  bulkUpsertAttendanceSchema,
  bulkUpsertGradesSchema,
} from "@/lib/validations/akademik";

export interface ActionState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

async function writeAudit(
  actorId: string,
  action: string,
  tableName: string,
  recordId: string | null,
  before: unknown,
  after: unknown,
) {
  await db.insert(auditLog).values({
    actorId,
    action,
    tableName,
    recordId,
    before: before as object | null,
    after: after as object | null,
  });
}

/**
 * Menyimpan seluruh baris entry nilai sekaligus (satu "Simpan Semua"),
 * TAPI tetap menulis SATU baris auditLog PER SISWA yang berubah — bukan
 * satu ringkasan batch — sesuai Bagian 9 brief secara harfiah. Efisien lewat
 * satu bulk INSERT ... ON CONFLICT DO UPDATE (Postgres menerapkan EXCLUDED
 * per-baris secara otomatis, bukan tercampur antar baris) diikuti satu bulk
 * INSERT ke audit_log — bukan loop N query, tapi tetap menghasilkan N baris
 * audit yang independen dan bisa ditelusuri per siswa.
 */
export async function bulkUpsertGrades(input: BulkUpsertGradesInput): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah nilai." };
  }

  const parsed = bulkUpsertGradesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data nilai tidak valid." };
  }

  const { subjectId, assessmentType, semester, rows } = parsed.data;
  const studentIds = rows.map((row) => row.studentId);

  const beforeRows = await db
    .select()
    .from(grades)
    .where(
      and(
        eq(grades.subjectId, subjectId),
        eq(grades.assessmentType, assessmentType),
        eq(grades.semester, semester),
        inArray(grades.studentId, studentIds),
      ),
    );
  const beforeByStudent = new Map(beforeRows.map((row) => [row.studentId, row]));

  const afterRows = await db
    .insert(grades)
    .values(
      rows.map((row) => ({
        studentId: row.studentId,
        subjectId,
        assessmentType,
        score: row.score,
        semester,
        enteredBy: auth.userId,
      })),
    )
    .onConflictDoUpdate({
      target: [grades.studentId, grades.subjectId, grades.assessmentType, grades.semester],
      set: {
        score: sql`excluded.score`,
        enteredBy: sql`excluded.entered_by`,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (afterRows.length > 0) {
    await db.insert(auditLog).values(
      afterRows.map((after) => ({
        actorId: auth.userId,
        action: beforeByStudent.has(after.studentId) ? "update" : "create",
        tableName: "grades",
        recordId: after.id,
        before: (beforeByStudent.get(after.studentId) ?? null) as object | null,
        after: after as object,
      })),
    );
  }

  revalidatePath("/akademik/nilai");
  revalidatePath("/dashboard/nilai");
  revalidatePath("/dashboard/audit-log");

  return { success: true, timestamp: Date.now() };
}

/** Pola identik dengan bulkUpsertGrades di atas, lihat komentar sana untuk rasionalisasi lengkap. */
export async function bulkUpsertAttendance(input: BulkUpsertAttendanceInput): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah absensi." };
  }

  const parsed = bulkUpsertAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data absensi tidak valid." };
  }

  const { date, rows } = parsed.data;
  const studentIds = rows.map((row) => row.studentId);

  const beforeRows = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.date, date), inArray(attendance.studentId, studentIds)));
  const beforeByStudent = new Map(beforeRows.map((row) => [row.studentId, row]));

  const afterRows = await db
    .insert(attendance)
    .values(
      rows.map((row) => ({
        studentId: row.studentId,
        date,
        status: row.status,
        recordedBy: auth.userId,
      })),
    )
    .onConflictDoUpdate({
      target: [attendance.studentId, attendance.date],
      set: {
        status: sql`excluded.status`,
        recordedBy: sql`excluded.recorded_by`,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (afterRows.length > 0) {
    await db.insert(auditLog).values(
      afterRows.map((after) => ({
        actorId: auth.userId,
        action: beforeByStudent.has(after.studentId) ? "update" : "create",
        tableName: "attendance",
        recordId: after.id,
        before: (beforeByStudent.get(after.studentId) ?? null) as object | null,
        after: after as object,
      })),
    );
  }

  revalidatePath("/akademik/absensi");
  revalidatePath("/dashboard/absensi");
  revalidatePath("/dashboard/audit-log");

  return { success: true, timestamp: Date.now() };
}

export async function createAssignment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang menambah tugas." };
  }

  const rawSubjectId = formData.get("subjectId");
  const subjectId = rawSubjectId && rawSubjectId !== "none" ? String(rawSubjectId) : null;
  const input: AssignmentFormInput = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    subjectId,
    dueDate: String(formData.get("dueDate") ?? ""),
  };
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tugas tidak valid." };
  }

  const [after] = await db
    .insert(assignments)
    .values({
      title: sanitizeUserText(parsed.data.title, 150),
      description: parsed.data.description ? sanitizeUserText(parsed.data.description, 1000) : null,
      subjectId: parsed.data.subjectId,
      dueDate: new Date(parsed.data.dueDate),
      createdBy: auth.userId,
    })
    .returning();

  await writeAudit(auth.userId, "create", "assignments", after?.id ?? null, null, after);

  revalidatePath("/akademik/tugas");
  revalidatePath("/dashboard/tugas");

  return { success: true, timestamp: Date.now() };
}

export async function createAnnouncement(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang menambah pengumuman." };
  }

  const input: AnnouncementFormInput = {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    isPinned: formData.get("isPinned") === "true",
  };
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data pengumuman tidak valid." };
  }

  const [after] = await db
    .insert(announcements)
    .values({
      title: sanitizeUserText(parsed.data.title, 150),
      content: sanitizeUserText(parsed.data.content, 5000),
      isPinned: parsed.data.isPinned,
      authorId: auth.userId,
    })
    .returning();

  await writeAudit(auth.userId, "create", "announcements", after?.id ?? null, null, after);

  revalidatePath("/akademik/pengumuman");
  revalidatePath("/dashboard/pengumuman");

  return { success: true, timestamp: Date.now() };
}

export async function createSubject(
  name: string,
): Promise<ActionState & { subject?: { id: string; name: string } }> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang menambahkan mata pelajaran." };
  }

  const cleanName = sanitizeUserText(name, 100).trim();
  if (!cleanName || cleanName.length < 2) {
    return { error: "Nama mata pelajaran minimal 2 karakter." };
  }

  try {
    const [inserted] = await db
      .insert(subjects)
      .values({ name: cleanName })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      return { error: "Mata pelajaran sudah terdaftar." };
    }

    await writeAudit(auth.userId, "create", "subjects", inserted.id, null, inserted);
    revalidatePath("/dashboard/nilai");
    revalidatePath("/dashboard/jadwal");
    return { success: true, subject: inserted };
  } catch {
    return { error: "Gagal menambahkan mata pelajaran." };
  }
}

export async function deleteSubject(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang menghapus mata pelajaran." };
  }

  const [existing] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  if (!existing) {
    return { error: "Mata pelajaran tidak ditemukan." };
  }

  await db.delete(subjects).where(eq(subjects.id, id));
  await writeAudit(auth.userId, "delete", "subjects", id, existing, null);
  revalidatePath("/dashboard/nilai");
  revalidatePath("/dashboard/jadwal");
  return { success: true };
}
