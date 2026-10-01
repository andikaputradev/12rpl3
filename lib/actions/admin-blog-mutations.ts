"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { auditLog, blogCategories, blogComments, blogPosts } from "@/lib/db/schema";
import { sanitizeUserText, slugify } from "@/lib/utils";
import { blogCategorySchema } from "@/lib/validations/blog";
// Skema alasan penolakan generik dipakai ulang dari validations/prestasi.ts
// (tempat pertama kali didefinisikan untuk rejectPortfolio) — tidak ada
// yang blog-spesifik di dalamnya, mendefinisikan ulang hanya akan membuat
// dua skema identik bisa diam-diam menyimpang.
import { moderationRejectionSchema } from "@/lib/validations/prestasi";

export interface ActionState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

const STAFF_ROLES = ["super_admin", "wali_kelas", "pengurus"] as const;

async function writeAudit(
  actorId: string,
  action: string,
  tableName: string,
  recordId: string | null,
  before: unknown,
  after: unknown,
) {
  await db.insert(auditLog).values({
    actorId,
    action,
    tableName,
    recordId,
    before: before as object | null,
    after: after as object | null,
  });
}

export async function approvePost(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menerbitkan artikel." };
  }

  const [before] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!before) return { error: "Artikel tidak ditemukan." };

  const [after] = await db
    .update(blogPosts)
    .set({
      status: "published",
      publishedAt: before.publishedAt ?? new Date(),
      moderatedBy: auth.userId,
      rejectionReason: null,
    })
    .where(eq(blogPosts.id, id))
    .returning();

  await writeAudit(auth.userId, "approve", "blog_posts", id, before, after);

  revalidatePath("/blog");
  revalidatePath(`/blog/${before.slug}`);
  revalidatePath("/dashboard/blog");

  return { success: true, timestamp: Date.now() };
}

export async function rejectPost(id: string, reason: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menolak artikel." };
  }

  const reasonResult = moderationRejectionSchema.safeParse(reason);
  if (!reasonResult.success) {
    return { error: reasonResult.error.issues[0]?.message ?? "Alasan penolakan wajib diisi." };
  }

  const [before] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!before) return { error: "Artikel tidak ditemukan." };

  const [after] = await db
    .update(blogPosts)
    .set({
      status: "rejected",
      moderatedBy: auth.userId,
      rejectionReason: sanitizeUserText(reasonResult.data, 500),
    })
    .where(eq(blogPosts.id, id))
    .returning();

  await writeAudit(auth.userId, "reject", "blog_posts", id, before, after);

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog/tulisan-saya");

  return { success: true, timestamp: Date.now() };
}

/** Soft-delete lewat is_hidden — lihat deleteOwnComment di blog-mutations.ts untuk padanan hard-delete milik penulis sendiri. */
export async function hideComment(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menyembunyikan komentar." };
  }

  const [before] = await db.select().from(blogComments).where(eq(blogComments.id, id)).limit(1);
  if (!before) return { error: "Komentar tidak ditemukan." };

  const [after] = await db
    .update(blogComments)
    .set({ isHidden: true, hiddenBy: auth.userId })
    .where(eq(blogComments.id, id))
    .returning();

  await writeAudit(auth.userId, "hide", "blog_comments", id, before, after);

  const [post] = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.id, before.postId))
    .limit(1);
  if (post) revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/dashboard/blog");

  return { success: true, timestamp: Date.now() };
}

export async function createBlogCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menambah kategori." };
  }

  const parsed = blogCategorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nama kategori tidak valid." };
  }

  const slug = slugify(parsed.data.name);
  const [existing] = await db
    .select({ id: blogCategories.id })
    .from(blogCategories)
    .where(eq(blogCategories.slug, slug))
    .limit(1);
  if (existing) return { error: "Kategori dengan nama serupa sudah ada." };

  const [after] = await db
    .insert(blogCategories)
    .values({ name: sanitizeUserText(parsed.data.name, 50), slug })
    .returning();

  await writeAudit(auth.userId, "create", "blog_categories", after?.id ?? null, null, after);

  revalidatePath("/blog");
  revalidatePath("/dashboard/blog");

  return { success: true, timestamp: Date.now() };
}

export async function deleteBlogCategory(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menghapus kategori." };
  }

  const [before] = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).limit(1);
  if (!before) return { error: "Kategori tidak ditemukan." };

  // categoryId di blog_posts bereferensi onDelete: "set null" — artikel
  // dengan kategori ini TIDAK ikut terhapus, hanya kehilangan kategorinya.
  await db.delete(blogCategories).where(eq(blogCategories.id, id));
  await writeAudit(auth.userId, "delete", "blog_categories", id, before, null);

  revalidatePath("/blog");
  revalidatePath("/dashboard/blog");

  return { success: true, timestamp: Date.now() };
}
