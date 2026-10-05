"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { uploadDocumentServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { assignmentSubmissions, assignments, auditLog } from "@/lib/db/schema";
import { limitAssignmentSubmission } from "@/lib/rate-limit";
import { sanitizeUserText } from "@/lib/utils";
import { submissionNotesSchema } from "@/lib/validations/akademik";

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
 * Signature 3-parameter (assignmentId, prevState, formData) alih-alih 2
 * parameter literal brief (assignmentId, formData) - supaya kompatibel
 * dengan useActionState (butuh (prevState, formData) sebagai dua argumen
 * TERAKHIR). Komponen client mem-bind assignmentId lebih dulu:
 * `submitAssignment.bind(null, assignmentId)` sebelum diberikan ke
 * useActionState - pola resmi React untuk parameterized form action.
 */
export async function submitAssignment(
  assignmentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali." };
  }

  const rate = await limitAssignmentSubmission(auth.userId);
  if (rate.limited) {
    return { error: "Terlalu banyak pengumpulan tugas dalam 24 jam terakhir. Coba lagi nanti." };
  }

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);
  if (!assignment) {
    return { error: "Tugas tidak ditemukan." };
  }

  const notesResult = submissionNotesSchema.safeParse(formData.get("notes") ?? "");
  if (!notesResult.success) {
    return { error: notesResult.error.issues[0]?.message ?? "Catatan tidak valid." };
  }
  const notes = notesResult.data ? sanitizeUserText(notesResult.data, 500) : null;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Berkas tugas wajib diunggah (gambar atau PDF)." };
  }

  let uploaded: Awaited<ReturnType<typeof uploadDocumentServerSide>>;
  try {
    uploaded = await uploadDocumentServerSide({
      file,
      folder: "tugas",
      publicId: `${assignmentId}_${auth.userId}`,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal mengunggah berkas." };
  }

  const [before] = await db
    .select()
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignmentId),
        eq(assignmentSubmissions.studentId, auth.userId),
      ),
    )
    .limit(1);

  const [after] = await db
    .insert(assignmentSubmissions)
    .values({
      assignmentId,
      studentId: auth.userId,
      fileUrl: uploaded.url,
      notes,
      submittedAt: new Date(),
      reviewedByStaff: false,
    })
    .onConflictDoUpdate({
      target: [assignmentSubmissions.assignmentId, assignmentSubmissions.studentId],
      set: {
        fileUrl: uploaded.url,
        notes,
        submittedAt: new Date(),
        // Kiriman ulang membatalkan status tinjauan staf sebelumnya - berkas
        // sudah berbeda, staf perlu meninjau ulang, bukan mewarisi status
        // "sudah ditinjau" dari berkas lama yang sudah tidak ada.
        reviewedByStaff: false,
      },
    })
    .returning();

  await writeAudit(
    auth.userId,
    before ? "resubmit" : "create",
    "assignment_submissions",
    after?.id ?? null,
    before ?? null,
    after,
  );

  revalidatePath("/akademik/tugas");

  return { success: true, timestamp: Date.now() };
}
