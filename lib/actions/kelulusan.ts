import "server-only";
import { and, eq, lt, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { type KelulusanContent, kelulusanContent, pesanKesan, profiles } from "@/lib/db/schema";

const FEED_PAGE_SIZE = 12;

export interface YearbookEntry {
  id: string;
  slug: string | null;
  fullName: string;
  photoUrl: string | null;
  yearbookQuote: string | null;
}

/** Fallback yearbookPhotoUrl -> avatarUrl (Bagian 6 prompt); tanpa kutipan tetap tampil apa adanya, tanpa placeholder palsu. */
export async function getYearbookEntries(): Promise<YearbookEntry[]> {
  const rows = await db
    .select({
      id: profiles.id,
      slug: profiles.slug,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      yearbookPhotoUrl: profiles.yearbookPhotoUrl,
      yearbookQuote: profiles.yearbookQuote,
    })
    .from(profiles)
    .where(and(eq(profiles.role, "siswa"), eq(profiles.isPublic, true)))
    .orderBy(profiles.absenNumber);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    fullName: row.fullName,
    photoUrl: row.yearbookPhotoUrl ?? row.avatarUrl,
    yearbookQuote: row.yearbookQuote,
  }));
}

export interface PesanKesanReceivedView {
  id: string;
  message: string;
  fromName: string | null;
  isAnonymous: boolean;
  status: "pending_review" | "approved" | "rejected";
  createdAt: Date;
}

/**
 * Termasuk yang masih pending_review (kontrak §4 prompt) agar penerima tahu
 * ada kesan masuk meski belum tayang publik. fromName di-null-kan bila
 * isAnonymous: "anonimitas terhadap SESAMA SISWA" (Asumsi Kunci #4 prompt)
 * berlaku juga di sini, penerima adalah sesama siswa, bukan staf.
 */
export async function getPesanKesanReceived(): Promise<PesanKesanReceivedView[]> {
  const auth = await requireAuthenticatedUser();

  const rows = await db
    .select({
      id: pesanKesan.id,
      message: pesanKesan.message,
      isAnonymous: pesanKesan.isAnonymous,
      status: pesanKesan.status,
      createdAt: pesanKesan.createdAt,
      fromName: profiles.fullName,
    })
    .from(pesanKesan)
    .innerJoin(profiles, eq(pesanKesan.fromStudentId, profiles.id))
    .where(eq(pesanKesan.toStudentId, auth.userId))
    .orderBy(pesanKesan.createdAt);

  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    isAnonymous: row.isAnonymous,
    status: row.status as "pending_review" | "approved" | "rejected",
    createdAt: row.createdAt,
    fromName: row.isAnonymous ? null : row.fromName,
  }));
}

export interface PesanKesanDisplay {
  id: string;
  message: string;
  fromName: string | null;
  toName: string;
  createdAt: Date;
}

export interface PesanKesanFeedPage {
  items: PesanKesanDisplay[];
  nextCursor: string | null;
}

/**
 * Cursor base64url(JSON) atas (createdAt, id): pola identik
 * encodeCursor/decodeCursor pada lib/actions/blog.ts, trik limit+1 untuk
 * deteksi halaman berikutnya, tie-break id agar stabil saat createdAt sama.
 */
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString(
    "base64url",
  );
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") return null;
    return { createdAt: new Date(parsed.createdAt), id: parsed.id };
  } catch {
    return null;
  }
}

export async function getPesanKesanPublicFeed(cursor?: string): Promise<PesanKesanFeedPage> {
  const decoded = cursor ? decodeCursor(cursor) : null;
  const toProfiles = alias(profiles, "to_profiles");

  const rows = await db
    .select({
      id: pesanKesan.id,
      message: pesanKesan.message,
      isAnonymous: pesanKesan.isAnonymous,
      createdAt: pesanKesan.createdAt,
      fromName: profiles.fullName,
      toName: toProfiles.fullName,
    })
    .from(pesanKesan)
    .innerJoin(profiles, eq(pesanKesan.fromStudentId, profiles.id))
    .innerJoin(toProfiles, eq(pesanKesan.toStudentId, toProfiles.id))
    .where(
      and(
        eq(pesanKesan.status, "approved"),
        decoded
          ? or(
              lt(pesanKesan.createdAt, decoded.createdAt),
              and(eq(pesanKesan.createdAt, decoded.createdAt), lt(pesanKesan.id, decoded.id)),
            )
          : undefined,
      ),
    )
    .orderBy(pesanKesan.createdAt, pesanKesan.id)
    .limit(FEED_PAGE_SIZE + 1);

  const hasMore = rows.length > FEED_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) => ({
      id: row.id,
      message: row.message,
      fromName: row.isAnonymous ? null : row.fromName,
      toName: row.toName,
      createdAt: row.createdAt,
    })),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

const DEFAULT_KELULUSAN_CONTENT: KelulusanContent = {
  id: 1,
  introText: null,
  compilationVideoUrl: null,
  updatedBy: null,
  updatedAt: new Date(0),
};

export async function getKelulusanContent(): Promise<KelulusanContent> {
  const [row] = await db.select().from(kelulusanContent).where(eq(kelulusanContent.id, 1)).limit(1);
  return row ?? DEFAULT_KELULUSAN_CONTENT;
}
