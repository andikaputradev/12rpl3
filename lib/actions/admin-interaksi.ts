import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  aspirations,
  type GuestbookContext,
  type GuestbookEntry,
  guestbookEntries,
  profiles,
} from "@/lib/db/schema";

const STAFF_ROLES = ["super_admin", "wali_kelas", "pengurus"] as const;

export async function getPendingGuestbook(context?: GuestbookContext): Promise<GuestbookEntry[]> {
  await requireStaffRole(STAFF_ROLES);

  return db
    .select()
    .from(guestbookEntries)
    .where(
      context
        ? and(eq(guestbookEntries.status, "pending_review"), eq(guestbookEntries.context, context))
        : eq(guestbookEntries.status, "pending_review"),
    )
    .orderBy(asc(guestbookEntries.createdAt));
}

export interface PendingAspiration {
  id: string;
  content: string;
  isAnonymous: boolean;
  authorName: string;
  createdAt: Date;
}

/**
 * authorName TETAP disertakan di sini (berbeda dari getAspirations publik):
 * anonimitas hanya berlaku terhadap sesama siswa, bukan terhadap staf
 * (Asumsi Kunci #4 prompt: akuntabilitas staf tetap terjaga).
 */
export async function getPendingAspirations(): Promise<PendingAspiration[]> {
  await requireStaffRole(STAFF_ROLES);

  const rows = await db
    .select({
      id: aspirations.id,
      content: aspirations.content,
      isAnonymous: aspirations.isAnonymous,
      authorName: profiles.fullName,
      createdAt: aspirations.createdAt,
    })
    .from(aspirations)
    .innerJoin(profiles, eq(aspirations.authorId, profiles.id))
    .where(eq(aspirations.status, "pending_review"))
    .orderBy(asc(aspirations.createdAt));

  return rows;
}
