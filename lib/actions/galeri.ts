import "server-only";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { GalleryAlbum, GalleryItem } from "@/lib/db/schema";
import { galleryAlbums, galleryItems } from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AlbumWithCount extends GalleryAlbum {
  approvedItemCount: number;
}

const ALBUM_PAGE_SIZE = 12;

interface AlbumCursor {
  createdAt: string;
  id: string;
}

function encodeCursor(cursor: AlbumCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(raw: string): AlbumCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (typeof parsed.createdAt === "string" && typeof parsed.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function getAlbums(
  category?: (typeof galleryAlbums.category.enumValues)[number],
  cursor?: string,
): Promise<{ albums: AlbumWithCount[]; nextCursor: string | null }> {
  const decoded = cursor ? decodeCursor(cursor) : null;

  const conditions = [
    category ? eq(galleryAlbums.category, category) : undefined,
    decoded
      ? or(
          lt(galleryAlbums.createdAt, new Date(decoded.createdAt)),
          and(
            eq(galleryAlbums.createdAt, new Date(decoded.createdAt)),
            lt(galleryAlbums.id, decoded.id),
          ),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: galleryAlbums.id,
      title: galleryAlbums.title,
      slug: galleryAlbums.slug,
      category: galleryAlbums.category,
      eventDate: galleryAlbums.eventDate,
      description: galleryAlbums.description,
      coverImageUrl: galleryAlbums.coverImageUrl,
      createdBy: galleryAlbums.createdBy,
      createdAt: galleryAlbums.createdAt,
      approvedItemCount:
        sql<number>`count(${galleryItems.id}) filter (where ${galleryItems.status} = 'approved')`.mapWith(
          Number,
        ),
    })
    .from(galleryAlbums)
    .leftJoin(galleryItems, eq(galleryItems.albumId, galleryAlbums.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(galleryAlbums.id)
    .orderBy(desc(galleryAlbums.createdAt), desc(galleryAlbums.id))
    .limit(ALBUM_PAGE_SIZE + 1);

  const hasMore = rows.length > ALBUM_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, ALBUM_PAGE_SIZE) : rows;
  const last = page.at(-1);

  return {
    albums: page,
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

export interface AlbumWithItems extends GalleryAlbum {
  items: GalleryItem[];
}

/**
 * Item approved untuk semua pengunjung, DITAMBAH item milik pengguna sendiri
 * yang masih pending_review (agar pengunggah melihat statusnya sendiri di
 * halaman album) — RLS menegakkan batas yang sama sebagai lapis kedua.
 */
export async function getAlbumBySlug(slug: string): Promise<AlbumWithItems | null> {
  const [album] = await db
    .select()
    .from(galleryAlbums)
    .where(eq(galleryAlbums.slug, slug))
    .limit(1);
  if (!album) return null;

  let currentUserId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  } catch {
    currentUserId = null;
  }

  const visibilityCondition = currentUserId
    ? or(eq(galleryItems.status, "approved"), eq(galleryItems.uploadedBy, currentUserId))
    : eq(galleryItems.status, "approved");

  const items = await db
    .select()
    .from(galleryItems)
    .where(and(eq(galleryItems.albumId, album.id), visibilityCondition))
    .orderBy(desc(galleryItems.createdAt));

  return { ...album, items };
}

export async function getMyUploads(): Promise<
  (GalleryItem & { albumTitle: string; albumSlug: string })[]
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = await db
    .select({
      id: galleryItems.id,
      albumId: galleryItems.albumId,
      type: galleryItems.type,
      mediaUrl: galleryItems.mediaUrl,
      thumbnailUrl: galleryItems.thumbnailUrl,
      caption: galleryItems.caption,
      status: galleryItems.status,
      uploadedBy: galleryItems.uploadedBy,
      rejectionReason: galleryItems.rejectionReason,
      moderatedBy: galleryItems.moderatedBy,
      moderatedAt: galleryItems.moderatedAt,
      createdAt: galleryItems.createdAt,
      albumTitle: galleryAlbums.title,
      albumSlug: galleryAlbums.slug,
    })
    .from(galleryItems)
    .innerJoin(galleryAlbums, eq(galleryAlbums.id, galleryItems.albumId))
    .where(eq(galleryItems.uploadedBy, user.id))
    .orderBy(desc(galleryItems.createdAt));

  return rows;
}

export async function getActiveAlbumsForUpload(): Promise<
  { id: string; title: string; slug: string }[]
> {
  return db
    .select({ id: galleryAlbums.id, title: galleryAlbums.title, slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .orderBy(desc(galleryAlbums.createdAt));
}

export async function getAllAlbumsForAdmin(): Promise<GalleryAlbum[]> {
  return db.select().from(galleryAlbums).orderBy(desc(galleryAlbums.createdAt));
}

/** Khusus sitemap: hanya slug album yang punya minimal satu item approved. */
export async function getIndexableAlbumSlugs(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .innerJoin(galleryItems, eq(galleryItems.albumId, galleryAlbums.id))
    .where(eq(galleryItems.status, "approved"));
  return rows.map((r) => r.slug);
}
