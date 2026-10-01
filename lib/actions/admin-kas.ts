"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { auditLog, kasSettings } from "@/lib/db/schema";
import { kasSettingsSchema } from "@/lib/validations/kas";

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

export async function updateKasSettings(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah pengaturan kas digital." };
  }

  const parsed = kasSettingsSchema.safeParse({
    danaNumber: formData.get("danaNumber") ?? "",
    danaAccountName: formData.get("danaAccountName") ?? "",
    nominalInfo: formData.get("nominalInfo") ?? "",
    instructions: formData.get("instructions") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const qrisFile = formData.get("qrisImage");
  let qrisImageUrl: string | undefined;

  if (qrisFile instanceof File && qrisFile.size > 0) {
    try {
      // folder "kas" sudah menamai ruang penyimpanan — publicId cukup
      // "qris" tanpa mengulang nama folder, agar path final kas/qris (bukan
      // kas/kas/qris). overwrite otomatis aktif karena publicId statis,
      // sehingga mengganti gambar QRIS selalu menimpa yang lama, bukan
      // menumpuk aset baru setiap kali staf mengunggah ulang.
      const uploaded = await uploadImageServerSide({
        file: qrisFile,
        folder: "kas",
        publicId: "qris",
      });
      qrisImageUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah gambar QRIS." };
    }
  }

  const [before] = await db.select().from(kasSettings).where(eq(kasSettings.id, 1)).limit(1);

  const [after] = await db
    .insert(kasSettings)
    .values({
      id: 1,
      danaNumber: parsed.data.danaNumber || null,
      danaAccountName: parsed.data.danaAccountName || null,
      nominalInfo: parsed.data.nominalInfo || null,
      instructions: parsed.data.instructions || null,
      qrisImageUrl: qrisImageUrl ?? before?.qrisImageUrl,
      updatedBy: auth.userId,
    })
    .onConflictDoUpdate({
      target: kasSettings.id,
      set: {
        danaNumber: parsed.data.danaNumber || null,
        danaAccountName: parsed.data.danaAccountName || null,
        nominalInfo: parsed.data.nominalInfo || null,
        instructions: parsed.data.instructions || null,
        ...(qrisImageUrl ? { qrisImageUrl } : {}),
        updatedBy: auth.userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  await writeAudit(
    auth.userId,
    before ? "update" : "create",
    "kas_settings",
    "1",
    before ?? null,
    after,
  );

  revalidatePath("/kas");
  revalidatePath("/dashboard/kas");

  return { success: true, timestamp: Date.now() };
}
