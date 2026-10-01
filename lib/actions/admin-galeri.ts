"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import type { GalleryItem } from "@/lib/db/schema";
import { auditLog, galleryAlbums, galleryItems, profiles } from "@/lib/db/schema";
import { sanitizeUserText, slugify } from "@/lib/utils";
import { albumSchema, rejectReasonSchema } from "@/lib/validations/galeri";

export interface AdminGaleriState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

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

async function generateUniqueAlbumSlug(title: string): Promise<string> {
  const base = slugify(title) || "album";
  let candidate = base;
  let suffix = 1;

  while (true) {
    const [existing] = await db
      .select({ id: galleryAlbums.id })
      .from(galleryAlbums)
      .where(eq(galleryAlbums.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function createAlbum(
  _prevState: AdminGaleriState,
  formData: FormData,
): Promise<AdminGaleriState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang membuat album." };
  }

  const parsed = albumSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    eventDate: formData.get("eventDate") || "",
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const slug = await generateUniqueAlbumSlug(parsed.data.title);
  const description = parsed.data.description
    ? sanitizeUserText(parsed.data.description, 500)
    : null;

  const [after] = await db
    .insert(galleryAlbums)
    .values({
      title: parsed.data.title,
      slug,
      category: parsed.data.category,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
      description,
      createdBy: auth.userId,
    })
    .returning();

  await writeAudit(auth.userId, "create", "gallery_albums", after?.id ?? null, null, after);
  revalidatePath("/galeri");
  revalidatePath("/dashboard/moderasi");

  return { success: true, timestamp: Date.now() };
}

export async function deleteAlbum(id: string): Promise<AdminGaleriState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang menghapus album." };
  }

  const [before] = await db.select().from(galleryAlbums).where(eq(galleryAlbums.id, id)).limit(1);
  if (!before) return { error: "Album tidak ditemukan." };

  await db.delete(galleryAlbums).where(eq(galleryAlbums.id, id));
  await writeAudit(auth.userId, "delete", "gallery_albums", id, before, null);

  revalidatePath("/galeri");
  revalidatePath(`/galeri/${before.slug}`);

  return { success: true, timestamp: Date.now() };
}

export interface GalleryItemWithContext extends GalleryItem {
  albumTitle: string;
  albumSlug: string;
  uploaderName: string;
}

export async function getPendingModeration(): Promise<GalleryItemWithContext[]> {
  try {
    await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return [];
  }

  const uploader = profiles;

  return db
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
      uploaderName: uploader.fullName,
    })
    .from(galleryItems)
    .innerJoin(galleryAlbums, eq(galleryAlbums.id, galleryItems.albumId))
    .innerJoin(uploader, eq(uploader.id, galleryItems.uploadedBy))
    .where(eq(galleryItems.status, "pending_review"))
    .orderBy(asc(galleryItems.createdAt));
}

export async function approveItem(id: string): Promise<AdminGaleriState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang menyetujui kiriman." };
  }

  const [before] = await db
    .select({ id: galleryItems.id, albumId: galleryItems.albumId, status: galleryItems.status })
    .from(galleryItems)
    .where(eq(galleryItems.id, id))
    .limit(1);

  if (!before) return { error: "Kiriman tidak ditemukan." };

  const [album] = await db
    .select({ slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .where(eq(galleryAlbums.id, before.albumId))
    .limit(1);

  const [after] = await db
    .update(galleryItems)
    .set({
      status: "approved",
      moderatedBy: auth.userId,
      moderatedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(galleryItems.id, id))
    .returning();

  await writeAudit(auth.userId, "approve", "gallery_items", id, before, after);

  revalidatePath("/dashboard/moderasi");
  if (album) revalidatePath(`/galeri/${album.slug}`);

  return { success: true, timestamp: Date.now() };
}

export async function rejectItem(id: string, formData: FormData): Promise<AdminGaleriState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);
  } catch {
    return { error: "Anda tidak berwenang menolak kiriman." };
  }

  const parsed = rejectReasonSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Alasan penolakan wajib diisi." };
  }

  const [before] = await db
    .select({ id: galleryItems.id, albumId: galleryItems.albumId, status: galleryItems.status })
    .from(galleryItems)
    .where(eq(galleryItems.id, id))
    .limit(1);

  if (!before) return { error: "Kiriman tidak ditemukan." };

  const [album] = await db
    .select({ slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .where(eq(galleryAlbums.id, before.albumId))
    .limit(1);

  const [after] = await db
    .update(galleryItems)
    .set({
      status: "rejected",
      rejectionReason: sanitizeUserText(parsed.data.reason, 300),
      moderatedBy: auth.userId,
      moderatedAt: new Date(),
    })
    .where(eq(galleryItems.id, id))
    .returning();

  await writeAudit(auth.userId, "reject", "gallery_items", id, before, after);

  revalidatePath("/dashboard/moderasi");
  if (album) revalidatePath(`/galeri/${album.slug}`);

  return { success: true, timestamp: Date.now() };
}
