import "server-only";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type AllowedImageFormat = "jpeg" | "png" | "webp";

interface MagicSignature<F extends string = AllowedImageFormat> {
  format: F;
  mimeType: string;
  extension: string;
  matches: (bytes: Uint8Array) => boolean;
}

// Tanda tangan biner diperiksa langsung dari isi berkas - bukan ekstensi nama
// file maupun header `Content-Type` yang dikirim client, karena keduanya
// dapat dipalsukan dengan trivial.
const SIGNATURES: MagicSignature<AllowedImageFormat>[] = [
  {
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: "jpg",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    format: "png",
    mimeType: "image/png",
    extension: "png",
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    format: "webp",
    mimeType: "image/webp",
    extension: "webp",
    matches: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

// Fase 3 - Bank Tugas menerima dokumen (Asumsi Kunci #6: resource_type
// "auto", gambar maupun PDF). PDF ditambahkan sebagai signature terpisah,
// TIDAK digabung ke SIGNATURES di atas, agar validateImageFile (dipakai
// admin-profil.ts untuk foto wali kelas/kelas/highlight, dan
// galeri-mutations.ts untuk galeri) tetap menolak PDF seperti semula -
// konteks itu memang harus tetap gambar-saja.
export type AllowedDocumentFormat = AllowedImageFormat | "pdf";

const PDF_SIGNATURE: MagicSignature<"pdf"> = {
  format: "pdf",
  mimeType: "application/pdf",
  extension: "pdf",
  matches: (b) =>
    b.length >= 5 &&
    b[0] === 0x25 &&
    b[1] === 0x50 &&
    b[2] === 0x44 &&
    b[3] === 0x46 &&
    b[4] === 0x2d,
};

const DOCUMENT_SIGNATURES: MagicSignature<AllowedDocumentFormat>[] = [...SIGNATURES, PDF_SIGNATURE];

export interface FileValidationResult<F extends string = AllowedImageFormat> {
  valid: boolean;
  error?: string;
  detected?: { format: F; mimeType: string; extension: string };
}

function checkAgainstSignatures<F extends string>(
  buffer: ArrayBuffer,
  signatures: MagicSignature<F>[],
  allowedLabel: string,
): FileValidationResult<F> {
  if (buffer.byteLength === 0) {
    return { valid: false, error: "Berkas kosong." };
  }

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `Ukuran berkas melebihi batas ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
    };
  }

  const bytes = new Uint8Array(buffer.slice(0, 16));
  const signature = signatures.find((sig) => sig.matches(bytes));

  if (!signature) {
    return {
      valid: false,
      error: `Format berkas tidak dikenali. Hanya ${allowedLabel} yang diizinkan.`,
    };
  }

  return {
    valid: true,
    detected: {
      format: signature.format,
      mimeType: signature.mimeType,
      extension: signature.extension,
    },
  };
}

// Tanda tangan biner diperiksa langsung dari isi berkas - bukan ekstensi nama
// file maupun header `Content-Type` yang dikirim client, karena keduanya
// dapat dipalsukan dengan trivial. Berlaku sama untuk kedua fungsi di bawah.
export function validateImageFile(buffer: ArrayBuffer): FileValidationResult<AllowedImageFormat> {
  return checkAgainstSignatures(buffer, SIGNATURES, "JPEG, PNG, atau WebP");
}

export function validateDocumentFile(
  buffer: ArrayBuffer,
): FileValidationResult<AllowedDocumentFormat> {
  return checkAgainstSignatures(buffer, DOCUMENT_SIGNATURES, "JPEG, PNG, WebP, atau PDF");
}
