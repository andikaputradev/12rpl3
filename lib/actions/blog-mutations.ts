"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { auditLog, blogComments, blogPosts, type ContentStatusSubset } from "@/lib/db/schema";
import { limitBlogPost, limitComment } from "@/lib/rate-limit";
import { sanitizeUserText, slugify } from "@/lib/utils";
import { deriveExcerpt } from "@/lib/utils/blog";
import { blogPostSchema, commentSchema, parseTagsInput } from "@/lib/validations/blog";

export interface ActionState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

const STAFF_ROLES = new Set(["super_admin", "wali_kelas", "pengurus"]);

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

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "artikel";
  let candidate = base;
  let suffix = 2;
  // Volume artikel satu blog kelas kecil - loop sekuensial aman, tidak
  // butuh strategi collision lebih rumit (mis. suffix acak) untuk skala ini.
  for (;;) {
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export interface CreateDraftResult extends ActionState {
  id?: string;
  slug?: string;
}

/**
 * contentMarkdown TIDAK dilewatkan sanitizeUserText - disimpan mentah apa
 * adanya. Sanitasi terjadi seluruhnya di RENDER time lewat MarkdownRenderer
 * (rehype-sanitize), bukan di STORAGE time: men-sanitasi saat simpan akan
 * merusak sintaks Markdown murni penulis dan berisiko drift tiap kali
 * artikel diedit ulang. Judul/ringkasan tetap disanitasi (teks polos biasa).
 */
export async function createDraftPost(
  _prevState: CreateDraftResult,
  formData: FormData,
): Promise<CreateDraftResult> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali." };
  }

  const rate = await limitBlogPost(auth.userId);
  if (rate.limited) {
    return { error: "Terlalu banyak draf dibuat dalam 24 jam terakhir. Coba lagi nanti." };
  }

  const rawCategoryId = formData.get("categoryId");
  const parsed = blogPostSchema.safeParse({
    title: formData.get("title"),
    contentMarkdown: formData.get("contentMarkdown"),
    excerpt: formData.get("excerpt") || "",
    categoryId: rawCategoryId && rawCategoryId !== "none" ? String(rawCategoryId) : null,
    tags: parseTagsInput(String(formData.get("tags") ?? "")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data artikel tidak valid." };
  }

  let coverImageUrl: string | null = null;
  const coverFile = formData.get("coverImage");
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      const uploaded = await uploadImageServerSide({
        file: coverFile,
        folder: "blog",
        publicId: `${auth.userId}-${Date.now()}`,
      });
      coverImageUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah cover image." };
    }
  }

  const slug = await generateUniqueSlug(parsed.data.title);
  const excerpt = parsed.data.excerpt || deriveExcerpt(parsed.data.contentMarkdown);

  const [after] = await db
    .insert(blogPosts)
    .values({
      title: sanitizeUserText(parsed.data.title, 150),
      slug,
      contentMarkdown: parsed.data.contentMarkdown.trim(),
      excerpt: sanitizeUserText(excerpt, 300),
      coverImageUrl,
      categoryId: parsed.data.categoryId,
      tags: parsed.data.tags,
      status: "draft",
      authorId: auth.userId,
    })
    .returning();

  if (!after) return { error: "Gagal menyimpan draf." };

  await writeAudit(auth.userId, "create", "blog_posts", after.id, null, after);
  revalidatePath("/blog/tulisan-saya");

  return { success: true, timestamp: Date.now(), id: after.id, slug: after.slug };
}

export interface SubmitForReviewResult extends ActionState {
  status?: ContentStatusSubset | "published";
}

/**
 * Fungsi paling kritis keamanannya di Fase 4 (Bagian 4 & 10 brief): status
 * akhir (`pending_review` vs `published`) ditentukan SELURUHNYA dari role
 * profil sesi server di sini - TIDAK ADA parameter status yang diterima
 * dari client sama sekali, sehingga tidak ada nilai apa pun yang bisa
 * dimanipulasi untuk memaksa hasil `published`.
 */
export async function submitPostForReview(id: string): Promise<SubmitForReviewResult> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali." };
  }

  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!post) return { error: "Artikel tidak ditemukan." };

  const isOwner = post.authorId === auth.userId;
  const isStaff = STAFF_ROLES.has(auth.profile.role);
  if (!isOwner && !isStaff) {
    return { error: "Anda tidak berwenang mengubah status artikel ini." };
  }
  if (isOwner && !isStaff && !["draft", "pending_review", "rejected"].includes(post.status)) {
    return { error: "Artikel sudah diterbitkan, tidak perlu dikirim ulang." };
  }

  const finalStatus = isStaff ? "published" : "pending_review";
  const publishedAt = finalStatus === "published" ? new Date() : post.publishedAt;

  const [after] = await db
    .update(blogPosts)
    .set({
      status: finalStatus,
      publishedAt,
      moderatedBy: isStaff ? auth.userId : post.moderatedBy,
      rejectionReason: null,
    })
    .where(eq(blogPosts.id, id))
    .returning();

  await writeAudit(auth.userId, "submit_for_review", "blog_posts", id, post, after);

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog/tulisan-saya");
  revalidatePath("/dashboard/blog");

  return { success: true, timestamp: Date.now(), status: finalStatus };
}

export async function addComment(
  postId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali untuk berkomentar." };
  }

  const rate = await limitComment(auth.userId);
  if (rate.limited) {
    return { error: "Terlalu banyak komentar dalam waktu singkat. Coba lagi sebentar lagi." };
  }

  const parsed = commentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Komentar tidak valid." };
  }

  const [post] = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, status: blogPosts.status })
    .from(blogPosts)
    .where(eq(blogPosts.id, postId))
    .limit(1);
  if (post?.status !== "published") {
    return { error: "Artikel tidak ditemukan atau belum diterbitkan." };
  }

  await db.insert(blogComments).values({
    postId,
    authorId: auth.userId,
    content: sanitizeUserText(parsed.data.content, 1000),
  });

  revalidatePath(`/blog/${post.slug}`);

  return { success: true, timestamp: Date.now() };
}

/**
 * Hard-delete, HANYA untuk penulis komentar itu sendiri - staf TIDAK
 * memakai fungsi ini (bahkan ditolak eksplisit di sini), staf memakai
 * hideComment() di admin-blog-mutations.ts (soft-delete lewat isHidden),
 * sesuai pemisahan wewenang Bagian 10 brief: "penghapusan permanen hanya
 * untuk komentar milik sendiri oleh penulisnya".
 */
export async function deleteOwnComment(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return { error: "Sesi tidak ditemukan." };
  }

  const [comment] = await db.select().from(blogComments).where(eq(blogComments.id, id)).limit(1);
  if (!comment) return { error: "Komentar tidak ditemukan." };
  if (comment.authorId !== auth.userId) {
    return { error: "Anda hanya bisa menghapus komentar milik sendiri." };
  }

  const [post] = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.id, comment.postId))
    .limit(1);

  await db.delete(blogComments).where(eq(blogComments.id, id));
  if (post) revalidatePath(`/blog/${post.slug}`);

  return { success: true, timestamp: Date.now() };
}
