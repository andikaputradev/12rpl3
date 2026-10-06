"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "@/lib/validations/auth";

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

export async function changeMyPassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan. Silakan masuk terlebih dahulu." };
  }

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsed = changePasswordSchema.safeParse({ newPassword, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Kata sandi tidak valid." };
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      password: parsed.data.newPassword,
    });

    if (error) {
      return { error: error.message || "Gagal memperbarui kata sandi." };
    }

    await db.insert(auditLog).values({
      actorId: auth.userId,
      action: "CHANGE_PASSWORD_SELF",
      tableName: "profiles",
      recordId: auth.userId,
      before: null,
      after: { passwordChanged: true },
    });

    revalidatePath("/profil-saya");
    return { success: true, timestamp: Date.now() };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui kata sandi.",
    };
  }
}
