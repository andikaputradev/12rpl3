"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { auditLog, berandaHighlights, classProfile } from "@/lib/db/schema";
import { classProfileSchema, highlightSchema } from "@/lib/validations/admin-profil";

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

export async function updateClassProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah profil kelas." };
  }

  let misi: unknown;
  try {
    misi = JSON.parse(String(formData.get("misi") ?? "[]"));
  } catch {
    return { error: "Format data misi tidak valid." };
  }

  const parsed = classProfileSchema.safeParse({
    motto: formData.get("motto"),
    sejarah: formData.get("sejarah"),
    visi: formData.get("visi"),
    misi,
    tahunAjaran: formData.get("tahunAjaran"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const photoFile = formData.get("foto");
  let fotoKelasUrl: string | undefined;

  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({
        file: photoFile,
        folder: "avatar",
        publicId: "class-profile/foto-kelas",
      });
      fotoKelasUrl = uploaded.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengunggah foto kelas.";
      return { error: message };
    }
  }

  const [before] = await db.select().from(classProfile).where(eq(classProfile.id, 1)).limit(1);

  const [after] = await db
    .insert(classProfile)
    .values({
      id: 1,
      ...parsed.data,
      fotoKelasUrl: fotoKelasUrl ?? before?.fotoKelasUrl,
      updatedBy: auth.userId,
    })
    .onConflictDoUpdate({
      target: classProfile.id,
      set: {
        motto: parsed.data.motto,
        sejarah: parsed.data.sejarah,
        visi: parsed.data.visi,
        misi: parsed.data.misi,
        tahunAjaran: parsed.data.tahunAjaran,
        ...(fotoKelasUrl ? { fotoKelasUrl } : {}),
        updatedBy: auth.userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  await writeAudit(auth.userId, "update", "class_profile", "1", before ?? null, after);

  revalidatePath("/");
  revalidatePath("/profil");
  revalidatePath("/dashboard/profil");

  return { success: true, timestamp: Date.now() };
}

export async function createHighlight(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang menambah highlight." };
  }

  const imageFile = formData.get("image");
  let imageUrl: string;

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({ file: imageFile, folder: "galeri" });
      imageUrl = uploaded.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengunggah gambar.";
      return { error: message };
    }
  } else {
    return { error: "Gambar highlight wajib diunggah." };
  }

  const parsed = highlightSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl,
    linkHref: formData.get("linkHref") || undefined,
    displayOrder: formData.get("displayOrder") || 0,
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const [after] = await db
    .insert(berandaHighlights)
    .values({ ...parsed.data, createdBy: auth.userId })
    .returning();

  await writeAudit(auth.userId, "create", "beranda_highlights", after?.id ?? null, null, after);
  revalidatePath("/");
  revalidatePath("/dashboard/profil");

  return { success: true, timestamp: Date.now() };
}

export async function updateHighlight(
  id: string,
  input: { title: string; description: string; isActive: boolean },
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang mengubah highlight." };
  }

  const parsed = highlightSchema
    .pick({ title: true, description: true, isActive: true })
    .safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const [before] = await db
    .select()
    .from(berandaHighlights)
    .where(eq(berandaHighlights.id, id))
    .limit(1);

  if (!before) {
    return { error: "Highlight tidak ditemukan." };
  }

  const [after] = await db
    .update(berandaHighlights)
    .set(parsed.data)
    .where(eq(berandaHighlights.id, id))
    .returning();

  await writeAudit(auth.userId, "update", "beranda_highlights", id, before, after);
  revalidatePath("/");
  revalidatePath("/dashboard/profil");

  return { success: true, timestamp: Date.now() };
}

export async function deleteHighlight(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang menghapus highlight." };
  }

  const [before] = await db
    .select()
    .from(berandaHighlights)
    .where(eq(berandaHighlights.id, id))
    .limit(1);

  if (!before) {
    return { error: "Highlight tidak ditemukan." };
  }

  await db.delete(berandaHighlights).where(eq(berandaHighlights.id, id));
  await writeAudit(auth.userId, "delete", "beranda_highlights", id, before, null);

  revalidatePath("/");
  revalidatePath("/dashboard/profil");

  return { success: true, timestamp: Date.now() };
}

// createAcademicEvent dan setFeaturedCountdown DIPINDAH ke
// lib/actions/admin-jadwal.ts sejak Fase 3 (bukan diduplikasi) - brief Fase 3
// Bagian 4 secara eksplisit menempatkan createAcademicEvent di sana sebagai
// "perluasan dari Fase 1, tambah field category". Mengonsolidasikan seluruh
// aksi academicEvents (termasuk yang sudah ada sejak Fase 1) ke satu berkas
// domain jadwal menghindari dua implementasi createAcademicEvent yang bisa
// diam-diam menyimpang satu sama lain. components/admin/events-manager.tsx
// kini mengimpor keduanya dari admin-jadwal.ts.
