import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export interface StudentListItem {
  id: string;
  slug: string | null;
  fullName: string;
  absenNumber: number | null;
  avatarUrl: string | null;
}

export const getStudentList = cache(async (): Promise<StudentListItem[]> => {
  try {
    return await db
      .select({
        id: profiles.id,
        slug: profiles.slug,
        fullName: profiles.fullName,
        absenNumber: profiles.absenNumber,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(and(inArray(profiles.role, ["siswa", "pengurus"]), eq(profiles.isPublic, true)))
      .orderBy(asc(profiles.absenNumber));
  } catch (error) {
    console.error("[direktori] student list error:", error);
    return [];
  }
});

export interface StudentDetail {
  id: string;
  fullName: string;
  absenNumber: number | null;
  avatarUrl: string | null;
  bio: string | null;
  citaCita: string | null;
  socialLinks: { instagram?: string; tiktok?: string } | null;
}

/**
 * Mengembalikan `null` baik saat slug tidak ada MAUPUN saat siswa bersangkutan
 * `isPublic = false` — kedua kasus sengaja tidak bisa dibedakan dari luar,
 * mencegah kebocoran informasi keberadaan profil privat (pemanggil memicu
 * `notFound()` untuk keduanya secara identik).
 */
export const getStudentBySlug = cache(async (slug: string): Promise<StudentDetail | null> => {
  try {
    const [row] = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        absenNumber: profiles.absenNumber,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        citaCita: profiles.citaCita,
        socialLinks: profiles.socialLinks,
        isPublic: profiles.isPublic,
        role: profiles.role,
      })
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);

    if (!row?.isPublic || (row.role !== "siswa" && row.role !== "pengurus")) return null;

    const { isPublic: _isPublic, role: _role, ...detail } = row;
    return detail;
  } catch (error) {
    console.error(`[direktori] error for slug ${slug}:`, error);
    return null;
  }
});

export const getAllPublicStudentSlugs = cache(async (): Promise<string[]> => {
  try {
    const rows = await db
      .select({ slug: profiles.slug })
      .from(profiles)
      .where(and(inArray(profiles.role, ["siswa", "pengurus"]), eq(profiles.isPublic, true)));
    return rows.map((r) => r.slug).filter((slug): slug is string => Boolean(slug));
  } catch (error) {
    console.error("[direktori] slugs error:", error);
    return [];
  }
});
