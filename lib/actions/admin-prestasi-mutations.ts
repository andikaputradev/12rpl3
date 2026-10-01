"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import {
  achievementParticipants,
  achievements,
  alumniTestimonials,
  auditLog,
  portfolioProjects,
} from "@/lib/db/schema";
import { sanitizeUserText } from "@/lib/utils";
import {
  type AchievementFormInput,
  achievementSchema,
  moderationRejectionSchema,
  type TestimonialFormInput,
  testimonialSchema,
} from "@/lib/validations/prestasi";

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

const STAFF_ROLES = ["super_admin", "wali_kelas", "pengurus"] as const;

export async function createAchievement(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menambah prestasi." };
  }

  const input: AchievementFormInput = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    level: String(formData.get("level") ?? "") as AchievementFormInput["level"],
    eventDate: String(formData.get("eventDate") ?? ""),
    participantIds: formData.getAll("participantIds").map(String),
  };
  const parsed = achievementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data prestasi tidak valid." };
  }

  let certificateUrl: string | null = null;
  const certificateFile = formData.get("certificate");
  if (certificateFile instanceof File && certificateFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({
        file: certificateFile,
        folder: "prestasi",
        publicId: `sertifikat-${Date.now()}`,
      });
      certificateUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah sertifikat." };
    }
  }

  const [after] = await db
    .insert(achievements)
    .values({
      title: sanitizeUserText(parsed.data.title, 150),
      description: parsed.data.description ? sanitizeUserText(parsed.data.description, 1000) : null,
      level: parsed.data.level,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
      certificateUrl,
      createdBy: auth.userId,
    })
    .returning();

  const uniqueParticipants = [...new Set(parsed.data.participantIds)];
  if (after && uniqueParticipants.length > 0) {
    await db
      .insert(achievementParticipants)
      .values(uniqueParticipants.map((studentId) => ({ achievementId: after.id, studentId })));
  }

  await writeAudit(auth.userId, "create", "achievements", after?.id ?? null, null, after);

  revalidatePath("/prestasi");
  revalidatePath("/dashboard/prestasi");

  return { success: true, timestamp: Date.now() };
}

export async function deleteAchievement(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menghapus prestasi." };
  }

  const [before] = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
  if (!before) return { error: "Prestasi tidak ditemukan." };

  await db.delete(achievements).where(eq(achievements.id, id));
  await writeAudit(auth.userId, "delete", "achievements", id, before, null);

  revalidatePath("/prestasi");
  revalidatePath("/dashboard/prestasi");

  return { success: true, timestamp: Date.now() };
}

export async function approvePortfolio(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menyetujui portofolio." };
  }

  const [before] = await db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.id, id))
    .limit(1);
  if (!before) return { error: "Proyek tidak ditemukan." };

  const [after] = await db
    .update(portfolioProjects)
    .set({ status: "approved", moderatedBy: auth.userId, rejectionReason: null })
    .where(eq(portfolioProjects.id, id))
    .returning();

  await writeAudit(auth.userId, "approve", "portfolio_projects", id, before, after);

  revalidatePath("/prestasi");
  revalidatePath("/dashboard/portofolio");

  return { success: true, timestamp: Date.now() };
}

export async function rejectPortfolio(id: string, reason: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menolak portofolio." };
  }

  const reasonResult = moderationRejectionSchema.safeParse(reason);
  if (!reasonResult.success) {
    return { error: reasonResult.error.issues[0]?.message ?? "Alasan penolakan wajib diisi." };
  }

  const [before] = await db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.id, id))
    .limit(1);
  if (!before) return { error: "Proyek tidak ditemukan." };

  const [after] = await db
    .update(portfolioProjects)
    .set({
      status: "rejected",
      moderatedBy: auth.userId,
      rejectionReason: sanitizeUserText(reasonResult.data, 500),
    })
    .where(eq(portfolioProjects.id, id))
    .returning();

  await writeAudit(auth.userId, "reject", "portfolio_projects", id, before, after);

  revalidatePath("/dashboard/portofolio");

  return { success: true, timestamp: Date.now() };
}

export async function createAlumniTestimonial(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menambah testimoni." };
  }

  const input: TestimonialFormInput = {
    name: String(formData.get("name") ?? ""),
    quote: String(formData.get("quote") ?? ""),
    contextNote: String(formData.get("contextNote") ?? ""),
  };
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data testimoni tidak valid." };
  }

  let photoUrl: string | null = null;
  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({
        file: photoFile,
        folder: "alumni",
        publicId: `${Date.now()}`,
      });
      photoUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah foto." };
    }
  }

  const [after] = await db
    .insert(alumniTestimonials)
    .values({
      name: sanitizeUserText(parsed.data.name, 100),
      quote: sanitizeUserText(parsed.data.quote, 1000),
      contextNote: parsed.data.contextNote ? sanitizeUserText(parsed.data.contextNote, 200) : null,
      photoUrl,
      addedBy: auth.userId,
    })
    .returning();

  await writeAudit(auth.userId, "create", "alumni_testimonials", after?.id ?? null, null, after);

  revalidatePath("/prestasi");
  revalidatePath("/dashboard/alumni");

  return { success: true, timestamp: Date.now() };
}

export async function deleteAlumniTestimonial(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menghapus testimoni." };
  }

  const [before] = await db
    .select()
    .from(alumniTestimonials)
    .where(eq(alumniTestimonials.id, id))
    .limit(1);
  if (!before) return { error: "Testimoni tidak ditemukan." };

  await db.delete(alumniTestimonials).where(eq(alumniTestimonials.id, id));
  await writeAudit(auth.userId, "delete", "alumni_testimonials", id, before, null);

  revalidatePath("/prestasi");
  revalidatePath("/dashboard/alumni");

  return { success: true, timestamp: Date.now() };
}
