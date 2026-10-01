import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateDocumentFile, validateImageFile } from "./validate-file";

function bufferFrom(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a];

describe("validateImageFile", () => {
  it("menerima JPEG valid berdasarkan magic bytes", () => {
    const result = validateImageFile(bufferFrom([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));
    expect(result.valid).toBe(true);
    expect(result.detected?.format).toBe("jpeg");
  });

  it("menerima PNG valid berdasarkan magic bytes", () => {
    const result = validateImageFile(
      bufferFrom([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]),
    );
    expect(result.valid).toBe(true);
    expect(result.detected?.format).toBe("png");
  });

  it("menerima WebP valid berdasarkan magic bytes RIFF/WEBP", () => {
    const bytes = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
    const result = validateImageFile(bufferFrom(bytes));
    expect(result.valid).toBe(true);
    expect(result.detected?.format).toBe("webp");
  });

  it("menolak berkas dengan ekstensi .jpg tapi isi bukan gambar (mis. skrip)", () => {
    const fakeScript = new TextEncoder().encode("#!/bin/sh\necho pwned");
    const result = validateImageFile(fakeScript.buffer as ArrayBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/tidak dikenali/);
  });

  it("menolak header JPEG yang dipalsukan sebagian (byte ketiga salah)", () => {
    const result = validateImageFile(bufferFrom([0xff, 0xd8, 0x00, 0x00]));
    expect(result.valid).toBe(false);
  });

  it("menolak berkas kosong", () => {
    const result = validateImageFile(bufferFrom([]));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/kosong/);
  });

  it("menolak berkas melebihi batas ukuran", () => {
    const oversized = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    oversized.set([0xff, 0xd8, 0xff]);
    const result = validateImageFile(oversized.buffer);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Ukuran berkas/);
  });

  it("menolak PDF — konteks gambar (profil/galeri) tidak pernah menerima dokumen", () => {
    const result = validateImageFile(bufferFrom(PDF_BYTES));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/tidak dikenali/);
  });
});

describe("validateDocumentFile", () => {
  it("menerima PDF valid berdasarkan magic bytes %PDF-", () => {
    const result = validateDocumentFile(bufferFrom(PDF_BYTES));
    expect(result.valid).toBe(true);
    expect(result.detected?.format).toBe("pdf");
    expect(result.detected?.mimeType).toBe("application/pdf");
  });

  it("tetap menerima JPEG/PNG/WebP (Bank Tugas mendukung foto kerjaan tugas)", () => {
    expect(validateDocumentFile(bufferFrom([0xff, 0xd8, 0xff, 0xe0])).detected?.format).toBe(
      "jpeg",
    );
    expect(
      validateDocumentFile(bufferFrom([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).detected
        ?.format,
    ).toBe("png");
  });

  it("menolak header PDF yang dipalsukan sebagian (byte kelima salah)", () => {
    const corrupted = [...PDF_BYTES];
    corrupted[4] = 0x00; // seharusnya 0x2d ('-')
    const result = validateDocumentFile(bufferFrom(corrupted));
    expect(result.valid).toBe(false);
  });

  it("menolak format lain di luar JPEG/PNG/WebP/PDF, mis. berkas .docx (ZIP)", () => {
    // .docx sebenarnya arsip ZIP (magic bytes 0x50 0x4b 0x03 0x04) — sengaja
    // TIDAK diterima karena resource_type "auto" Cloudinary + validasi ini
    // hanya menjamin 4 format yang secara eksplisit didukung UI unggah.
    const result = validateDocumentFile(bufferFrom([0x50, 0x4b, 0x03, 0x04]));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/JPEG, PNG, WebP, atau PDF/);
  });

  it("menolak berkas kosong dan melebihi batas ukuran, konsisten dengan validateImageFile", () => {
    expect(validateDocumentFile(bufferFrom([])).valid).toBe(false);
    const oversized = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    oversized.set(PDF_BYTES);
    expect(validateDocumentFile(oversized.buffer).valid).toBe(false);
  });
});
