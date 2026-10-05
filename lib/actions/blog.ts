import "server-only";
import { and, asc, desc, eq, lt, or } from "drizzle-orm";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  type BlogComment,
  blogCategories,
  blogComments,
  blogPosts,
  profiles,
} from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const POST_PAGE_SIZE = 9;

interface PostCursor {
  publishedAt: string;
  id: string;
}

function encodeCursor(cursor: PostCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(raw: string): PostCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (typeof parsed.publishedAt === "string" && typeof parsed.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  authorName: string;
  publishedAt: Date;
}

export async function getBlogCategories() {
  return db
    .select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug })
    .from(blogCategories)
    .orderBy(asc(blogCategories.name));
}

/** Dipakai sitemap.ts - HANYA slug published, konsisten dengan Bagian 9 brief ("draft/pending_review/rejected tidak pernah masuk sitemap"). */
export async function getPublishedPostSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"));
  return rows.map((row) => row.slug);
}

/**
 * Filter kategori/tag lewat query param URL yang dapat dibagikan (Bagian 6
 * brief) - pemanggil (page.tsx) yang membaca searchParams dan meneruskan ke
 * sini, bukan state client. Paginasi cursor-based pola identik Fase 2
 * (getAlbums di lib/actions/galeri.ts): limit+1 untuk deteksi hasMore,
 * cursor (publishedAt, id) ganda untuk tie-break stabil.
 */
export async function getPublishedPosts(
  categorySlug?: string,
  tag?: string,
  cursor?: string,
): Promise<{ posts: BlogPostSummary[]; nextCursor: string | null }> {
  const decoded = cursor ? decodeCursor(cursor) : null;

  let categoryId: string | undefined;
  if (categorySlug) {
    const [category] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, categorySlug))
      .limit(1);
    if (!category) return { posts: [], nextCursor: null };
    categoryId = category.id;
  }

  const conditions = [
    eq(blogPosts.status, "published"),
    categoryId ? eq(blogPosts.categoryId, categoryId) : undefined,
    decoded
      ? or(
          lt(blogPosts.publishedAt, new Date(decoded.publishedAt)),
          and(
            eq(blogPosts.publishedAt, new Date(decoded.publishedAt)),
            lt(blogPosts.id, decoded.id),
          ),
        )
      : undefined,
  ].filter((c) => c !== undefined);

  const rows = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      authorName: profiles.fullName,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
    })
    .from(blogPosts)
    .innerJoin(profiles, eq(blogPosts.authorId, profiles.id))
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.id))
    .limit(POST_PAGE_SIZE + 1);

  // Tag disaring di JS (jsonb array, volume kecil untuk satu blog kelas) -
  // menghindari kebutuhan indeks GIN yang tidak sepadan untuk skala ini.
  const filtered = tag ? rows.filter((row) => row.tags.includes(tag)) : rows;

  const hasMore = filtered.length > POST_PAGE_SIZE;
  const page = hasMore ? filtered.slice(0, POST_PAGE_SIZE) : filtered;
  const last = page.at(-1);

  return {
    posts: page.map((row) => ({ ...row, publishedAt: row.publishedAt as Date })),
    nextCursor:
      hasMore && last?.publishedAt
        ? encodeCursor({ publishedAt: last.publishedAt.toISOString(), id: last.id })
        : null,
  };
}

export interface BlogPostFull {
  id: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  status: "draft" | "pending_review" | "approved" | "rejected" | "published" | "archived";
  authorId: string;
  authorName: string;
  publishedAt: Date | null;
  createdAt: Date;
  rejectionReason: string | null;
}

/**
 * published untuk siapa pun; draft/pending_review/rejected HANYA untuk
 * penulisnya sendiri atau staf - dicek manual di sini karena koneksi `db`
 * memakai kredensial langsung yang MELEWATI RLS (lihat lib/db/index.ts).
 * RLS di migration tetap lapis kedua untuk akses REST API langsung.
 */
export async function getPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const [row] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      contentMarkdown: blogPosts.contentMarkdown,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      tags: blogPosts.tags,
      status: blogPosts.status,
      authorId: blogPosts.authorId,
      authorName: profiles.fullName,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      rejectionReason: blogPosts.rejectionReason,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
    })
    .from(blogPosts)
    .innerJoin(profiles, eq(blogPosts.authorId, profiles.id))
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!row) return null;
  if (row.status === "published") return row;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.id === row.authorId) return row;

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (profile && ["super_admin", "wali_kelas", "pengurus"].includes(profile.role)) return row;

  return null;
}

export async function getMyPosts() {
  const { userId } = await requireAuthenticatedUser();
  return db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      status: blogPosts.status,
      rejectionReason: blogPosts.rejectionReason,
      createdAt: blogPosts.createdAt,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.authorId, userId))
    .orderBy(desc(blogPosts.createdAt));
}

export interface CommentView extends BlogComment {
  authorName: string;
}

/** Hanya isHidden = false - komentar disembunyikan staf tidak pernah dikirim ke publik. */
export async function getComments(postId: string): Promise<CommentView[]> {
  return db
    .select({
      id: blogComments.id,
      postId: blogComments.postId,
      authorId: blogComments.authorId,
      content: blogComments.content,
      isHidden: blogComments.isHidden,
      hiddenBy: blogComments.hiddenBy,
      createdAt: blogComments.createdAt,
      authorName: profiles.fullName,
    })
    .from(blogComments)
    .innerJoin(profiles, eq(blogComments.authorId, profiles.id))
    .where(and(eq(blogComments.postId, postId), eq(blogComments.isHidden, false)))
    .orderBy(asc(blogComments.createdAt));
}
