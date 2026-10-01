"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { AlbumWithCount } from "@/lib/actions/galeri";
import { getAlbums } from "@/lib/actions/galeri";
import { uploadImageServerSide } from "@/lib/cloudinary/signed-upload";
import { db } from "@/lib/db";
import { auditLog, galleryAlbums, galleryItems } from "@/lib/db/schema";
import { getClientIp, limitGalleryUpload } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeUserText } from "@/lib/utils";
import { type UploadItemInput, uploadItemSchema } from "@/lib/validations/galeri";
import { validateYoutubeUrl } from "@/lib/youtube/oembed";

const STAFF_ROLES = new Set(["super_admin", "wali_kelas", "pengurus"]);

export async function loadMoreAlbumsAction(
  category: (typeof galleryAlbums.category.enumValues)[number] | undefined,
  cursor: string,
): Promise<{ albums: AlbumWithCount[]; nextCursor: string | null }> {
  return getAlbums(category, cursor);
}

export interface UploadActionState {
  error?: string;
  success?: boolean;
  status?: "approved" | "pending_review";
  timestamp?: number;
}

export async function uploadGalleryItem(
  _prevState: UploadActionState,
  formData: FormData,
): Promise<UploadActionState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile) {
    return { error: "Profil pengguna tidak ditemukan." };
  }

  const ip = getClientIp(await headers());
  const { limited } = await limitGalleryUpload(`${user.id}:${ip}`);
  if (limited) {
    return { error: "Batas 10 unggahan per 24 jam tercapai. Coba lagi besok." };
  }

  const type = formData.get("type");
  const rawInput: Record<string, unknown> = {
    albumId: formData.get("albumId"),
    type,
    caption: formData.get("caption") || undefined,
  };
  if (type === "video") {
    rawInput.youtubeUrl = formData.get("youtubeUrl");
  }

  const parsed = uploadItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const input: UploadItemInput = parsed.data;

  const [album] = await db
    .select({ id: galleryAlbums.id, slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .where(eq(galleryAlbums.id, input.albumId))
    .limit(1);

  if (!album) {
    return { error: "Album tidak ditemukan." };
  }

  const isStaff = STAFF_ROLES.has(profile.role);
  const status = isStaff ? "approved" : "pending_review";
  const sanitizedCaption = input.caption ? sanitizeUserText(input.caption, 280) : null;

  let mediaUrl: string;
  let thumbnailUrl: string | null = null;

  if (input.type === "image") {
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Berkas gambar wajib diunggah." };
    }
    try {
      const uploaded = await uploadImageServerSide({ file, folder: `galeri/${album.slug}` });
      mediaUrl = uploaded.url;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal mengunggah gambar." };
    }
  } else {
    try {
      const verified = await validateYoutubeUrl(input.youtubeUrl);
      mediaUrl = verified.videoId;
      thumbnailUrl = verified.thumbnailUrl;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Gagal memverifikasi video." };
    }
  }

  const [inserted] = await db
    .insert(galleryItems)
    .values({
      albumId: input.albumId,
      type: input.type,
      mediaUrl,
      thumbnailUrl,
      caption: sanitizedCaption,
      status,
      uploadedBy: user.id,
      ...(isStaff ? { moderatedBy: user.id, moderatedAt: new Date() } : {}),
    })
    .returning();

  await db.insert(auditLog).values({
    actorId: user.id,
    action: "create",
    tableName: "gallery_items",
    recordId: inserted?.id ?? null,
    before: null,
    after: inserted,
  });

  revalidatePath(`/galeri/${album.slug}`);
  revalidatePath("/dashboard/moderasi");

  return { success: true, status, timestamp: Date.now() };
}
