import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { blogComments, blogPosts, profiles } from "@/lib/db/schema";

export async function getPendingPosts() {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  return db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      authorName: profiles.fullName,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .innerJoin(profiles, eq(blogPosts.authorId, profiles.id))
    .where(eq(blogPosts.status, "pending_review"))
    .orderBy(asc(blogPosts.createdAt));
}

/**
 * Tidak ada di kontrak Server Action brief Bagian 4 secara eksplisit, tapi
 * diperlukan untuk mewujudkan "daftar komentar dengan aksi sembunyikan" di
 * /dashboard/blog (Bagian 7) — tanpa ini staf tidak punya cara melihat
 * komentar TERBARU lintas artikel untuk dimoderasi, hanya per-artikel.
 */
export async function getRecentComments(limit = 30) {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  return db
    .select({
      id: blogComments.id,
      content: blogComments.content,
      isHidden: blogComments.isHidden,
      createdAt: blogComments.createdAt,
      authorName: profiles.fullName,
      postTitle: blogPosts.title,
      postSlug: blogPosts.slug,
    })
    .from(blogComments)
    .innerJoin(profiles, eq(blogComments.authorId, profiles.id))
    .innerJoin(blogPosts, eq(blogComments.postId, blogPosts.id))
    .orderBy(desc(blogComments.createdAt))
    .limit(limit);
}
