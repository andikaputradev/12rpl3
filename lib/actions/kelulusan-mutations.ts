"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { auditLog, pesanKesan, profiles } from "@/lib/db/schema";
import { sanitizeUserText } from "@/lib/utils";
import { resolveAnonymousContentStatus } from "@/lib/utils/moderation";
import { pesanKesanSchema } from "@/lib/validations/kelulusan";

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

export async function submitPesanKesan(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }

  const parsed = pesanKesanSchema.safeParse({
    toStudentId: formData.get("toStudentId"),
    message: formData.get("message"),
    isAnonymous: formData.get("isAnonymous") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  if (parsed.data.toStudentId === auth.userId) {
    return { error: "Tidak bisa mengirim pesan-kesan untuk diri sendiri." };
  }

  const [recipient] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, parsed.data.toStudentId))
    .limit(1);
  if (!recipient) {
    return { error: "Penerima tidak ditemukan." };
  }

  const status = resolveAnonymousContentStatus(parsed.data.isAnonymous);
  const sanitizedMessage = sanitizeUserText(parsed.data.message, 1000);

  try {
    // Kirim ulang ke penerima yang sama MENIMPA (upsert) pesan sebelumnya,
    // bukan menumpuk baris baru: Asumsi Kunci §3 prompt schema, ditegakkan
    // lewat constraint unik (fromStudentId, toStudentId).
    const [saved] = await db
      .insert(pesanKesan)
      .values({
        fromStudentId: auth.userId,
        toStudentId: parsed.data.toStudentId,
        message: sanitizedMessage,
        isAnonymous: parsed.data.isAnonymous,
        status,
      })
      .onConflictDoUpdate({
        target: [pesanKesan.fromStudentId, pesanKesan.toStudentId],
        set: {
          message: sanitizedMessage,
          isAnonymous: parsed.data.isAnonymous,
          status,
          moderatedBy: null,
          createdAt: new Date(),
        },
      })
      .returning({ id: pesanKesan.id });

    if (saved) {
      await writeAudit(auth.userId, "create", "pesan_kesan", saved.id, null, {
        toStudentId: parsed.data.toStudentId,
        isAnonymous: parsed.data.isAnonymous,
        status,
      });
    }
  } catch (error) {
    console.error("[kelulusan] Gagal menyimpan pesan-kesan:", error);
    return { error: "Gagal mengirim pesan-kesan. Coba lagi nanti." };
  }

  revalidatePath("/kelulusan");
  return { success: true, timestamp: Date.now() };
}
