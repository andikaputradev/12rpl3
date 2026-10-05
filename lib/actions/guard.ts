import "server-only";
import type { Profile } from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AuthorizationError extends Error {
  constructor(message = "Anda tidak berwenang melakukan aksi ini.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

type StaffRole = "super_admin" | "wali_kelas" | "pengurus";

/**
 * Memverifikasi sesi aktif DAN role, langsung terhadap Supabase Auth
 * (`getUser()`, bukan `getSession()`), sebelum Server Action mutasi apa pun
 * dieksekusi. Melempar AuthorizationError bila gagal - pemanggil wajib fail
 * closed, bukan melanjutkan dengan asumsi default.
 */
export async function requireStaffRole(
  allowedRoles: readonly StaffRole[],
): Promise<{ userId: string; role: StaffRole; profile: Profile }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthorizationError("Sesi tidak ditemukan. Silakan masuk kembali.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || !allowedRoles.includes(profile.role as StaffRole)) {
    throw new AuthorizationError();
  }

  return { userId: user.id, role: profile.role as StaffRole, profile };
}

/**
 * Versi requireStaffRole untuk fungsi yang boleh dipanggil siapa pun yang
 * login (peran apa saja) - dipakai seluruh Server Action "milik sendiri" di
 * lib/actions/akademik.ts. Mengembalikan profile lengkap (termasuk role)
 * agar pemanggil dapat menegakkan pengecualian role spesifik (mis. pengurus
 * pada nilai/absensi) tanpa query tambahan.
 */
export async function requireAuthenticatedUser(): Promise<{ userId: string; profile: Profile }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthorizationError("Sesi tidak ditemukan. Silakan masuk kembali.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    throw new AuthorizationError("Profil pengguna tidak ditemukan.");
  }

  return { userId: user.id, profile };
}

/**
 * Fase 5: SATU-SATUNYA helper identitas di berkas ini yang TIDAK fail-closed:
 * mengembalikan `null` (bukan melempar AuthorizationError) bila tidak ada
 * sesi aktif. Dipakai HANYA oleh submitGuestbookEntry untuk mengisi authorId
 * secara opsional ketika penulis kebetulan sedang login (Asumsi Kunci #2
 * prompt: buku tamu adalah satu-satunya fitur tulis tanpa login di seluruh
 * sistem; login tidak boleh menjadi syarat, hanya informasi tambahan bila
 * tersedia). Tidak dipakai untuk keputusan otorisasi apa pun.
 */
export async function getOptionalUser(): Promise<{ userId: string; profile: Profile } | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;

  return { userId: user.id, profile };
}
