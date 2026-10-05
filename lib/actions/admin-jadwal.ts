"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  academicEvents,
  auditLog,
  classSchedule,
  type DayOfWeek,
  piketAssignments,
  piketSchedule,
} from "@/lib/db/schema";
import { academicEventSchema } from "@/lib/validations/admin-profil";
import {
  piketAssignmentInputSchema,
  type ScheduleEntryInput,
  scheduleEntriesSchema,
} from "@/lib/validations/jadwal";

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
 * Menyimpan seluruh tabel jadwal pelajaran sekaligus (replace-all dalam satu
 * transaksi), bukan upsert baris-per-baris - jadwal satu kelas berjumlah
 * kecil (≤60 baris) dan diedit sebagai satu lembar utuh di dashboard, sama
 * seperti filosofi entry massal nilai/absensi di fase ini. Delete-then-insert
 * dalam transaksi yang sama juga menghindari pelanggaran sementara
 * class_schedule_day_period_unique yang bisa terjadi pada upsert baris-per-
 * baris saat dua baris saling menukar jam.
 */
export async function upsertClassSchedule(entries: ScheduleEntryInput[]): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah jadwal pelajaran." };
  }

  const parsed = scheduleEntriesSchema.safeParse(entries);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data jadwal tidak valid." };
  }

  const before = await db.select().from(classSchedule);

  const after = await db.transaction(async (tx) => {
    await tx.delete(classSchedule);
    if (parsed.data.length === 0) return [];
    return tx
      .insert(classSchedule)
      .values(
        parsed.data.map((entry) => ({
          dayOfWeek: entry.dayOfWeek,
          periodNumber: entry.periodNumber,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subjectId: entry.subjectId,
          teacherName: entry.teacherName || null,
          room: entry.room || null,
        })),
      )
      .returning();
  });

  await writeAudit(auth.userId, "replace_all", "class_schedule", null, before, after);
  revalidatePath("/jadwal");
  revalidatePath("/dashboard/jadwal");

  return { success: true, timestamp: Date.now() };
}

/**
 * Menyimpan daftar siswa piket untuk SATU hari (replace-all untuk hari itu
 * saja, hari lain tidak tersentuh). Baris piket_schedule untuk hari tersebut
 * dibuat otomatis jika belum ada (onConflictDoNothing memastikan idempoten).
 */
export async function upsertPiketAssignment(
  dayOfWeek: DayOfWeek,
  studentIds: string[],
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah jadwal piket." };
  }

  const parsed = piketAssignmentInputSchema.safeParse({ dayOfWeek, studentIds });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data piket tidak valid." };
  }

  await db
    .insert(piketSchedule)
    .values({ dayOfWeek: parsed.data.dayOfWeek })
    .onConflictDoNothing({ target: piketSchedule.dayOfWeek });

  const [scheduleRow] = await db
    .select()
    .from(piketSchedule)
    .where(eq(piketSchedule.dayOfWeek, parsed.data.dayOfWeek))
    .limit(1);

  if (!scheduleRow) {
    return { error: "Gagal menyiapkan baris jadwal piket." };
  }

  const before = await db
    .select()
    .from(piketAssignments)
    .where(eq(piketAssignments.piketScheduleId, scheduleRow.id));

  const after = await db.transaction(async (tx) => {
    await tx.delete(piketAssignments).where(eq(piketAssignments.piketScheduleId, scheduleRow.id));
    if (parsed.data.studentIds.length === 0) return [];
    return tx
      .insert(piketAssignments)
      .values(
        parsed.data.studentIds.map((studentId) => ({
          piketScheduleId: scheduleRow.id,
          studentId,
        })),
      )
      .returning();
  });

  await writeAudit(auth.userId, "replace_all", "piket_assignments", scheduleRow.id, before, after);
  revalidatePath("/jadwal");
  revalidatePath("/dashboard/jadwal");

  return { success: true, timestamp: Date.now() };
}

/**
 * Dipindah dari lib/actions/admin-profil.ts (Fase 1) ke sini pada Fase 3 -
 * bukan diduplikasi - sesuai penempatan eksplisit brief Bagian 4, dengan
 * field `category` ditambahkan aditif pada parsing dan payload insert.
 */
export async function createAcademicEvent(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang menambah agenda kegiatan." };
  }

  const parsed = academicEventSchema.safeParse({
    title: formData.get("title"),
    eventDate: formData.get("eventDate"),
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
    isFeaturedCountdown: formData.get("isFeaturedCountdown") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  if (parsed.data.isFeaturedCountdown) {
    await db.update(academicEvents).set({ isFeaturedCountdown: false });
  }

  const [after] = await db
    .insert(academicEvents)
    .values({
      title: parsed.data.title,
      eventDate: new Date(parsed.data.eventDate),
      description: parsed.data.description,
      category: parsed.data.category,
      isFeaturedCountdown: parsed.data.isFeaturedCountdown,
      createdBy: auth.userId,
    })
    .returning();

  await writeAudit(auth.userId, "create", "academic_events", after?.id ?? null, null, after);
  revalidatePath("/");
  revalidatePath("/jadwal");
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard/jadwal");

  return { success: true, timestamp: Date.now() };
}

export async function deleteAcademicEvent(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang menghapus agenda akademik." };
  }

  const [before] = await db.select().from(academicEvents).where(eq(academicEvents.id, id)).limit(1);
  if (!before) {
    return { error: "Agenda tidak ditemukan." };
  }

  await db.delete(academicEvents).where(eq(academicEvents.id, id));
  await writeAudit(auth.userId, "delete", "academic_events", id, before, null);

  revalidatePath("/");
  revalidatePath("/jadwal");
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard/jadwal");

  return { success: true, timestamp: Date.now() };
}

/** Dipindah dari admin-profil.ts (Fase 1), logika tidak diubah. */
export async function setFeaturedCountdown(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah countdown unggulan." };
  }

  const [target] = await db.select().from(academicEvents).where(eq(academicEvents.id, id)).limit(1);

  if (!target) {
    return { error: "Agenda tidak ditemukan." };
  }

  await db.update(academicEvents).set({ isFeaturedCountdown: false });
  const [after] = await db
    .update(academicEvents)
    .set({ isFeaturedCountdown: true })
    .where(eq(academicEvents.id, id))
    .returning();

  await writeAudit(auth.userId, "set_featured", "academic_events", id, target, after);
  revalidatePath("/");
  revalidatePath("/dashboard/profil");

  return { success: true, timestamp: Date.now() };
}
