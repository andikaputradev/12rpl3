import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { validateDocumentFile, validateImageFile } from "@/lib/cloudinary/validate-file";
import { getCloudinaryEnv } from "@/lib/env";

// Fase 4: "portofolio" (thumbnail proyek siswa) dan "blog" (cover image
// artikel) ditambah aditif. Fase 5: "yearbook" (foto yearbook Corner
// Kelulusan, lihat lib/actions/profil-saya-mutations.ts).
const STATIC_UPLOAD_FOLDERS = new Set([
  "galeri",
  "avatar",
  "prestasi",
  "tugas",
  "kas",
  "portofolio",
  "blog",
  "alumni",
  "yearbook",
]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Menerima folder statis dari daftar tetap DI ATAS, atau pola dinamis
 * `galeri/{albumSlug}` untuk unggahan siswa Fase 2 (folder per album demi
 * kemudahan audit aset). Slug divalidasi ketat (huruf kecil/angka/tanda hubung
 * saja) agar tidak bisa dipakai untuk path traversal (mis. `galeri/../../etc`)
 * atau menulis ke folder Cloudinary di luar cakupan `galeri/`.
 */
function isAllowedFolder(folder: string): boolean {
  if (STATIC_UPLOAD_FOLDERS.has(folder)) return true;
  if (folder.startsWith("galeri/")) {
    const albumSlug = folder.slice("galeri/".length);
    return SLUG_PATTERN.test(albumSlug);
  }
  return false;
}

export interface SignedUploadRequest {
  folder: string;
  publicId?: string;
  tags?: string[];
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  tags?: string;
}

export function createSignedUploadParams(request: SignedUploadRequest): SignedUploadParams {
  if (!isAllowedFolder(request.folder)) {
    throw new Error(`Folder upload "${request.folder}" tidak diizinkan.`);
  }

  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder: request.folder,
  };
  if (request.publicId) paramsToSign.public_id = request.publicId;
  if (request.tags?.length) paramsToSign.tags = request.tags.join(",");

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder: request.folder,
    publicId: request.publicId,
    tags: request.tags?.join(","),
  };
}

export interface ServerSideUploadRequest {
  file: File;
  folder: string;
  publicId?: string;
}

export interface ServerSideUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload staf (foto wali kelas, foto kelas, gambar highlight): volume rendah,
 * hanya role pengurus ke atas. Berkas mengalir lewat server kita — bukan pola
 * "client unggah langsung ke Cloudinary dengan signature" — agar magic bytes
 * dapat diperiksa penuh sebelum diteruskan. Untuk upload publik bervolume
 * tinggi (galeri siswa, Fase 2), `createSignedUploadParams` di atas tetap
 * tersedia untuk pola direct-upload yang lebih hemat bandwidth server.
 */
export async function uploadImageServerSide(
  request: ServerSideUploadRequest,
): Promise<ServerSideUploadResult> {
  if (!isAllowedFolder(request.folder)) {
    throw new Error(`Folder upload "${request.folder}" tidak diizinkan.`);
  }

  const buffer = await request.file.arrayBuffer();
  const validation = validateImageFile(buffer);
  if (!validation.valid || !validation.detected) {
    throw new Error(validation.error ?? "Berkas tidak valid.");
  }

  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const base64 = Buffer.from(buffer).toString("base64");
  const dataUri = `data:${validation.detected.mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: request.folder,
    public_id: request.publicId,
    overwrite: Boolean(request.publicId),
    resource_type: "image",
    allowed_formats: ["jpg", "png", "webp"],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export interface DocumentUploadResult {
  url: string;
  publicId: string;
  format: string;
}

/**
 * Upload kiriman Bank Tugas (Fase 3, Asumsi Kunci #6): siswa mana pun boleh
 * memanggil ini untuk berkasnya sendiri — bukan staf-saja seperti
 * uploadImageServerSide di atas. Otorisasi "siapa boleh menulis baris
 * assignment_submissions mana" tetap ditegakkan di lib/actions (identitas
 * dari sesi server) dan RLS, BUKAN oleh fungsi ini; fungsi ini hanya
 * menjamin ISI berkas benar-benar JPEG/PNG/WebP/PDF lewat magic bytes
 * sebelum diteruskan ke Cloudinary dengan resource_type "auto" sesuai
 * spesifikasi brief (mendukung gambar maupun dokumen).
 */
export async function uploadDocumentServerSide(
  request: ServerSideUploadRequest,
): Promise<DocumentUploadResult> {
  if (!isAllowedFolder(request.folder)) {
    throw new Error(`Folder upload "${request.folder}" tidak diizinkan.`);
  }

  const buffer = await request.file.arrayBuffer();
  const validation = validateDocumentFile(buffer);
  if (!validation.valid || !validation.detected) {
    throw new Error(validation.error ?? "Berkas tidak valid.");
  }

  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const base64 = Buffer.from(buffer).toString("base64");
  const dataUri = `data:${validation.detected.mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: request.folder,
    public_id: request.publicId,
    overwrite: Boolean(request.publicId),
    resource_type: "auto",
    allowed_formats: ["jpg", "png", "webp", "pdf"],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
  };
}
