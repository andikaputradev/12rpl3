import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { type Profile, profiles } from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AuthorizationError extends Error {
  constructor(message = "Anda tidak berwenang melakukan aksi ini.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

type StaffRole = "super_admin" | "wali_kelas" | "pengurus";

function normalizeProfile(raw: Record<string, unknown>): Profile {
  return {
    id: String(raw.id),
    fullName: String(raw.fullName ?? raw.full_name ?? ""),
    nis: (raw.nis as string | null) ?? null,
    absenNumber: (raw.absenNumber as number | null) ?? (raw.absen_number as number | null) ?? null,
    role: (raw.role as Profile["role"]) ?? "siswa",
    jabatan: (raw.jabatan as string | null) ?? null,
    gender: (raw.gender as Profile["gender"]) ?? null,
    displayOrder:
      (raw.displayOrder as number | null) ?? (raw.display_order as number | null) ?? null,
    publicContact:
      (raw.publicContact as string | null) ?? (raw.public_contact as string | null) ?? null,
    slug: (raw.slug as string | null) ?? null,
    citaCita: (raw.citaCita as string | null) ?? (raw.cita_cita as string | null) ?? null,
    socialLinks:
      (raw.socialLinks as Profile["socialLinks"]) ??
      (raw.social_links as Profile["socialLinks"]) ??
      null,
    avatarUrl: (raw.avatarUrl as string | null) ?? (raw.avatar_url as string | null) ?? null,
    bio: (raw.bio as string | null) ?? null,
    isPublic: Boolean(raw.isPublic ?? raw.is_public ?? true),
    yearbookQuote:
      (raw.yearbookQuote as string | null) ?? (raw.yearbook_quote as string | null) ?? null,
    yearbookPhotoUrl:
      (raw.yearbookPhotoUrl as string | null) ?? (raw.yearbook_photo_url as string | null) ?? null,
    createdAt: raw.createdAt ? new Date(raw.createdAt as string | Date) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string | Date) : new Date(),
  };
}

async function fetchUserProfile(userId: string): Promise<Profile | null> {
  try {
    const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

    if (row) {
      return normalizeProfile(row);
    }
  } catch (error) {
    console.error("[guard] Drizzle query failed, falling back to Supabase client:", error);
  }

  // Fallback ke Supabase bila Drizzle query gagal
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  return data ? normalizeProfile(data) : null;
}

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

  const profile = await fetchUserProfile(user.id);

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

  const profile = await fetchUserProfile(user.id);

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

  const profile = await fetchUserProfile(user.id);

  if (!profile) return null;

  return { userId: user.id, profile };
}
