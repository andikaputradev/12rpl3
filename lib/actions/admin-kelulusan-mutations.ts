"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { auditLog, kelulusanContent, pesanKesan } from "@/lib/db/schema";
import { sanitizeUserText } from "@/lib/utils";
import { kelulusanContentSchema } from "@/lib/validations/kelulusan";
import { validateYoutubeUrl } from "@/lib/youtube/oembed";

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

const CONTENT_STAFF_ROLES = ["super_admin", "wali_kelas", "pengurus"] as const;
// SENGAJA HANYA dua peran (TANPA pengurus): disamakan persis dengan RLS
// kelulusan_content_update_staff (0012) dan class_profile_update_staff
// (0003): konten narasi resmi singleton, berbeda dari moderasi pesan-kesan
// per-baris di atas yang menyertakan pengurus. Lihat catatan penyesuaian #6
// pada drizzle/0012_fase5_interaksi_kelulusan_rls.sql.
const CONTENT_SETTINGS_STAFF_ROLES = ["super_admin", "wali_kelas"] as const;

export async function approvePesanKesan(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(CONTENT_STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menyetujui pesan-kesan." };
  }

  const [before] = await db.select().from(pesanKesan).where(eq(pesanKesan.id, id)).limit(1);
  if (!before) return { error: "Pesan-kesan tidak ditemukan." };

  const [after] = await db
    .update(pesanKesan)
    .set({ status: "approved", moderatedBy: auth.userId })
    .where(eq(pesanKesan.id, id))
    .returning();

  await writeAudit(auth.userId, "approve", "pesan_kesan", id, before, after);

  revalidatePath("/kelulusan");
  revalidatePath("/dashboard/kelulusan");
  return { success: true, timestamp: Date.now() };
}

/** Tanpa parameter reason: lihat catatan konsistensi pada rejectGuestbookEntry (admin-interaksi-mutations.ts): berlaku sama untuk ketiga tabel Fase 5 yang tidak memiliki kolom rejectionReason. */
export async function rejectPesanKesan(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(CONTENT_STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menolak pesan-kesan." };
  }

  const [before] = await db.select().from(pesanKesan).where(eq(pesanKesan.id, id)).limit(1);
  if (!before) return { error: "Pesan-kesan tidak ditemukan." };

  const [after] = await db
    .update(pesanKesan)
    .set({ status: "rejected", moderatedBy: auth.userId })
    .where(eq(pesanKesan.id, id))
    .returning();

  await writeAudit(auth.userId, "reject", "pesan_kesan", id, before, after);

  revalidatePath("/dashboard/kelulusan");
  return { success: true, timestamp: Date.now() };
}

export async function updateKelulusanContent(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(CONTENT_SETTINGS_STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang mengubah konten Corner Kelulusan." };
  }

  const parsed = kelulusanContentSchema.safeParse({
    introText: formData.get("introText") || undefined,
    compilationVideoUrl: formData.get("compilationVideoUrl") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  let compilationVideoUrl: string | null = null;
  if (parsed.data.compilationVideoUrl) {
    try {
      await validateYoutubeUrl(parsed.data.compilationVideoUrl);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Tautan video YouTube tidak valid.",
      };
    }
    compilationVideoUrl = parsed.data.compilationVideoUrl.trim();
  }

  const [before] = await db
    .select()
    .from(kelulusanContent)
    .where(eq(kelulusanContent.id, 1))
    .limit(1);

  const [after] = await db
    .insert(kelulusanContent)
    .values({
      id: 1,
      introText: parsed.data.introText ? sanitizeUserText(parsed.data.introText, 2000) : null,
      compilationVideoUrl,
      updatedBy: auth.userId,
    })
    .onConflictDoUpdate({
      target: kelulusanContent.id,
      set: {
        introText: parsed.data.introText ? sanitizeUserText(parsed.data.introText, 2000) : null,
        compilationVideoUrl,
        updatedBy: auth.userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  await writeAudit(auth.userId, "update", "kelulusan_content", "1", before ?? null, after);

  revalidatePath("/kelulusan");
  revalidatePath("/dashboard/kelulusan");
  return { success: true, timestamp: Date.now() };
}
