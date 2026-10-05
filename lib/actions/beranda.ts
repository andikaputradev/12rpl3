import "server-only";
import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import type { AcademicEvent, BerandaHighlight, ClassProfile, Profile } from "@/lib/db/schema";
import {
  academicEvents,
  berandaHighlights,
  classProfile,
  profiles,
  visitorCount,
} from "@/lib/db/schema";

export const getClassProfile = cache(async (): Promise<ClassProfile | null> => {
  try {
    const [row] = await db.select().from(classProfile).where(eq(classProfile.id, 1)).limit(1);
    return row ?? null;
  } catch (error) {
    console.error("[beranda] class profile error:", error);
    return null;
  }
});

export const getOrganizationalStructure = cache(async (): Promise<Profile[]> => {
  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.role, "pengurus"),
          isNotNull(profiles.jabatan),
          eq(profiles.isPublic, true),
        ),
      )
      .orderBy(asc(profiles.displayOrder));

    return rows.map((p) => {
      const isPlaceholder = !p.avatarUrl || p.avatarUrl.includes("pngtree");
      if (isPlaceholder && p.yearbookPhotoUrl) {
        return { ...p, avatarUrl: p.yearbookPhotoUrl };
      }
      return p;
    });
  } catch (error) {
    console.error("[beranda] organizational error:", error);
    return [];
  }
});

export const getWaliKelas = cache(async (): Promise<Profile | null> => {
  try {
    const [row] = await db.select().from(profiles).where(eq(profiles.role, "wali_kelas")).limit(1);
    if (!row) return null;
    const isPlaceholder = !row.avatarUrl || row.avatarUrl.includes("pngtree");
    if (isPlaceholder && row.yearbookPhotoUrl) {
      return { ...row, avatarUrl: row.yearbookPhotoUrl };
    }
    return row;
  } catch (error) {
    console.error("[beranda] wali kelas error:", error);
    return null;
  }
});

export interface StudentStats {
  total: number;
  laki: number;
  perempuan: number;
}

export const getStudentStats = cache(async (): Promise<StudentStats> => {
  try {
    const [row] = await db
      .select({
        total:
          sql<number>`count(*) filter (where ${profiles.role} in ('siswa', 'pengurus'))`.mapWith(
            Number,
          ),
        laki: sql<number>`count(*) filter (where ${profiles.role} in ('siswa', 'pengurus') and ${profiles.gender} = 'L')`.mapWith(
          Number,
        ),
        perempuan:
          sql<number>`count(*) filter (where ${profiles.role} in ('siswa', 'pengurus') and ${profiles.gender} = 'P')`.mapWith(
            Number,
          ),
      })
      .from(profiles);

    return row ?? { total: 0, laki: 0, perempuan: 0 };
  } catch (error) {
    console.error("[beranda] stats error:", error);
    return { total: 0, laki: 0, perempuan: 0 };
  }
});

export const getActiveHighlights = cache(async (): Promise<BerandaHighlight[]> => {
  try {
    return await db
      .select()
      .from(berandaHighlights)
      .where(eq(berandaHighlights.isActive, true))
      .orderBy(asc(berandaHighlights.displayOrder))
      .limit(4);
  } catch (error) {
    console.error("[beranda] highlights error:", error);
    return [];
  }
});

/** Khusus dashboard admin: termasuk highlight nonaktif, tanpa limit 4. */
export async function getAllHighlightsForAdmin(): Promise<BerandaHighlight[]> {
  try {
    return await db.select().from(berandaHighlights).orderBy(asc(berandaHighlights.displayOrder));
  } catch (error) {
    console.error("[beranda] admin highlights error:", error);
    return [];
  }
}

/** Khusus dashboard admin: seluruh agenda, bukan hanya yang featured. */
export async function getAllAcademicEvents(): Promise<AcademicEvent[]> {
  try {
    return await db.select().from(academicEvents).orderBy(asc(academicEvents.eventDate));
  } catch (error) {
    console.error("[beranda] admin events error:", error);
    return [];
  }
}

export const getFeaturedCountdown = cache(async (): Promise<AcademicEvent | null> => {
  try {
    const [row] = await db
      .select()
      .from(academicEvents)
      .where(eq(academicEvents.isFeaturedCountdown, true))
      .orderBy(desc(academicEvents.eventDate))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error("[beranda] featured countdown error:", error);
    return null;
  }
});

export const getVisitorCount = cache(async (): Promise<number> => {
  try {
    const [row] = await db.select().from(visitorCount).where(eq(visitorCount.id, 1)).limit(1);
    return row?.total ?? 0;
  } catch (error) {
    console.error("[beranda] visitor count error:", error);
    return 0;
  }
});

export function truncateDescription(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
