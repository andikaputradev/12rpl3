"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requireAuthenticatedUser } from "@/lib/actions/guard";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { auditLog, profiles } from "@/lib/db/schema";
import { sanitizeUserText } from "@/lib/utils";
import { updateMyProfileSchema } from "@/lib/validations/profil-saya";

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
 * Satu-satunya tempat siswa mengelola representasi dirinya sendiri di
 * seluruh situs (Bagian 7 prompt). `auth.userId` (diturunkan dari sesi
 * server lewat requireAuthenticatedUser) adalah SATU-SATUNYA sumber id baris
 * yang diubah: tidak pernah menerima id dari formData/client, menutup IDOR
 * di level tanda tangan fungsi sesuai Bagian 5 poin 2 brief.
 */
export async function updateMyProfile(
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

  const parsed = updateMyProfileSchema.safeParse({
    bio: formData.get("bio"),
    citaCita: formData.get("citaCita"),
    instagram: formData.get("instagram"),
    tiktok: formData.get("tiktok"),
    yearbookQuote: formData.get("yearbookQuote"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  let yearbookPhotoUrl: string | undefined;
  const photoFile = formData.get("yearbookPhoto");
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({
        file: photoFile,
        folder: "yearbook",
        publicId: `${auth.userId}-${Date.now()}`,
      });
      yearbookPhotoUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah foto yearbook." };
    }
  }

  const instagram = parsed.data.instagram ? sanitizeUserText(parsed.data.instagram, 50) : "";
  const tiktok = parsed.data.tiktok ? sanitizeUserText(parsed.data.tiktok, 50) : "";
  const socialLinks =
    instagram || tiktok
      ? { ...(instagram ? { instagram } : {}), ...(tiktok ? { tiktok } : {}) }
      : null;

  const updateValues: Partial<typeof profiles.$inferInsert> = {
    bio: parsed.data.bio ? sanitizeUserText(parsed.data.bio, 500) : null,
    citaCita: parsed.data.citaCita ? sanitizeUserText(parsed.data.citaCita, 150) : null,
    socialLinks,
    yearbookQuote: parsed.data.yearbookQuote
      ? sanitizeUserText(parsed.data.yearbookQuote, 280)
      : null,
  };
  if (yearbookPhotoUrl) {
    updateValues.yearbookPhotoUrl = yearbookPhotoUrl;
  }

  try {
    const [before] = await db
      .select({
        bio: profiles.bio,
        citaCita: profiles.citaCita,
        socialLinks: profiles.socialLinks,
        yearbookQuote: profiles.yearbookQuote,
        yearbookPhotoUrl: profiles.yearbookPhotoUrl,
      })
      .from(profiles)
      .where(eq(profiles.id, auth.userId))
      .limit(1);

    await db.update(profiles).set(updateValues).where(eq(profiles.id, auth.userId));

    await writeAudit(auth.userId, "update", "profiles", auth.userId, before ?? null, updateValues);
  } catch (error) {
    console.error("[profil-saya] Gagal menyimpan perubahan profil:", error);
    return { error: "Gagal menyimpan perubahan profil. Coba lagi nanti." };
  }

  revalidatePath("/profil-saya");
  revalidatePath("/kelulusan");
  revalidatePath(`/direktori/${auth.profile.slug}`);
  return { success: true, timestamp: Date.now() };
}
