"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { auditLog, profiles } from "@/lib/db/schema";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function updateUserRole(
  userId: string,
  newRole: "super_admin" | "wali_kelas" | "pengurus" | "siswa",
  newJabatan?: string | null,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin"]);
  } catch {
    return { error: "Hanya Super Admin yang berwenang mengubah peran pengguna." };
  }

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

  if (!existing) {
    return { error: "Pengguna tidak ditemukan." };
  }

  // Mencegah super admin mencabut haknya sendiri jika hanya ada 1 super admin
  if (existing.id === auth.userId && newRole !== "super_admin") {
    return { error: "Anda tidak dapat mencabut peran Super Admin dari akun Anda sendiri." };
  }

  await db
    .update(profiles)
    .set({
      role: newRole,
      jabatan: newJabatan !== undefined ? newJabatan : existing.jabatan,
    })
    .where(eq(profiles.id, userId));

  await db.insert(auditLog).values({
    actorId: auth.userId,
    action: "UPDATE_USER_ROLE",
    tableName: "profiles",
    recordId: userId,
    before: { role: existing.role, jabatan: existing.jabatan },
    after: { role: newRole, jabatan: newJabatan },
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateUserAcademicInfo(
  userId: string,
  data: {
    fullName?: string;
    nis?: string | null;
    absenNumber?: number | null;
    gender?: "L" | "P" | null;
    jabatan?: string | null;
  },
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas"]);
  } catch {
    return { error: "Anda tidak berwenang memperbarui data pengguna." };
  }

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

  if (!existing) {
    return { error: "Pengguna tidak ditemukan." };
  }

  await db
    .update(profiles)
    .set({
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.nis !== undefined ? { nis: data.nis } : {}),
      ...(data.absenNumber !== undefined ? { absenNumber: data.absenNumber } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.jabatan !== undefined ? { jabatan: data.jabatan } : {}),
    })
    .where(eq(profiles.id, userId));

  await db.insert(auditLog).values({
    actorId: auth.userId,
    action: "UPDATE_USER_INFO",
    tableName: "profiles",
    recordId: userId,
    before: existing,
    after: { ...existing, ...data },
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/direktori");
  return { success: true };
}
