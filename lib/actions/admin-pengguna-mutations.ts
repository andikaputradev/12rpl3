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

export async function createNewUser(data: {
  fullName: string;
  email: string;
  password?: string;
  role: "super_admin" | "wali_kelas" | "pengurus" | "siswa";
  jabatan?: string | null;
  nis?: string | null;
  absenNumber?: number | null;
  gender?: "L" | "P" | null;
}): Promise<ActionState & { userId?: string }> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin"]);
  } catch {
    return { error: "Hanya Super Admin yang berwenang menambah akun pengguna." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Konfigurasi server otentikasi tidak lengkap." };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const password = data.password && data.password.length >= 8 ? data.password : "Password123#";

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName.trim() },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Gagal membuat akun otentikasi." };
  }

  const userId = authData.user.id;
  const { slugify } = await import("@/lib/utils");
  const slug = slugify(data.fullName.trim());
  const defaultAvatar =
    "https://png.pngtree.com/png-vector/20250818/ourmid/pngtree-whatsapp-default-profile-photo-vector-png-image_17034397.webp";

  await db
    .insert(profiles)
    .values({
      id: userId,
      fullName: data.fullName.trim(),
      nis: data.nis?.trim() || null,
      absenNumber: data.absenNumber ?? null,
      role: data.role,
      jabatan: data.jabatan?.trim() || null,
      gender: data.gender ?? null,
      slug,
      avatarUrl: defaultAvatar,
      isPublic: true,
      displayOrder: data.absenNumber ?? 50,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: data.fullName.trim(),
        nis: data.nis?.trim() || null,
        absenNumber: data.absenNumber ?? null,
        role: data.role,
        jabatan: data.jabatan?.trim() || null,
        gender: data.gender ?? null,
        slug,
        avatarUrl: defaultAvatar,
        isPublic: true,
        displayOrder: data.absenNumber ?? 50,
      },
    });

  await db.insert(auditLog).values({
    actorId: auth.userId,
    action: "CREATE_USER",
    tableName: "profiles",
    recordId: userId,
    before: null,
    after: { ...data, id: userId },
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/direktori");
  return { success: true, userId };
}

export async function deleteUser(userId: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin"]);
  } catch {
    return { error: "Hanya Super Admin yang berwenang menghapus pengguna." };
  }

  if (auth.userId === userId) {
    return { error: "Anda tidak dapat menghapus akun Anda sendiri." };
  }

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!existing) {
    return { error: "Pengguna tidak ditemukan." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    await adminClient.auth.admin.deleteUser(userId);
  }

  await db.delete(profiles).where(eq(profiles.id, userId));

  await db.insert(auditLog).values({
    actorId: auth.userId,
    action: "DELETE_USER",
    tableName: "profiles",
    recordId: userId,
    before: existing,
    after: null,
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/direktori");
  return { success: true };
}

export async function resetUserPasswordToDefault(userId: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin"]);
  } catch {
    return { error: "Hanya Super Admin yang berwenang mereset kata sandi pengguna." };
  }

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!existing) {
    return { error: "Pengguna tidak ditemukan." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Konfigurasi otentikasi server tidak lengkap." };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const DEFAULT_PASSWORD = "Password123#";

  const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
    password: DEFAULT_PASSWORD,
  });

  if (resetError) {
    return { error: resetError.message || "Gagal mereset kata sandi ke default." };
  }

  await db.insert(auditLog).values({
    actorId: auth.userId,
    action: "RESET_PASSWORD_DEFAULT",
    tableName: "profiles",
    recordId: userId,
    before: null,
    after: { resetToDefault: true },
  });

  revalidatePath("/dashboard/pengguna");
  return { success: true };
}
