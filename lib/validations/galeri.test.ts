import { describe, expect, it } from "vitest";
import { albumSchema, rejectReasonSchema, uploadItemSchema } from "./galeri";

describe("albumSchema", () => {
  it("menerima data album valid", () => {
    const result = albumSchema.safeParse({
      title: "Study Tour Yogyakarta",
      category: "study_tour",
      eventDate: "2026-09-01",
      description: "Kunjungan industri dan wisata edukasi.",
    });
    expect(result.success).toBe(true);
  });

  it("menolak kategori di luar enum", () => {
    const result = albumSchema.safeParse({
      title: "Album Tidak Valid",
      category: "kategori_ngasal",
    });
    expect(result.success).toBe(false);
  });

  it("menolak judul terlalu pendek", () => {
    const result = albumSchema.safeParse({ title: "ab", category: "lomba" });
    expect(result.success).toBe(false);
  });
});

describe("uploadItemSchema — discriminated union image/video", () => {
  it("menerima item gambar tanpa youtubeUrl", () => {
    const result = uploadItemSchema.safeParse({
      albumId: "550e8400-e29b-41d4-a716-446655440000",
      type: "image",
      caption: "Kegiatan belajar kelompok.",
    });
    expect(result.success).toBe(true);
  });

  it("menerima item video dengan youtubeUrl valid", () => {
    const result = uploadItemSchema.safeParse({
      albumId: "550e8400-e29b-41d4-a716-446655440000",
      type: "video",
      // biome-ignore lint/security/noSecrets: ID video publik contoh, bukan kredensial.
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(result.success).toBe(true);
  });

  it("menolak item video tanpa youtubeUrl", () => {
    const result = uploadItemSchema.safeParse({
      albumId: "550e8400-e29b-41d4-a716-446655440000",
      type: "video",
    });
    expect(result.success).toBe(false);
  });

  it("menolak albumId yang bukan UUID", () => {
    const result = uploadItemSchema.safeParse({
      albumId: "bukan-uuid",
      type: "image",
    });
    expect(result.success).toBe(false);
  });

  it("menolak caption melebihi 280 karakter", () => {
    const result = uploadItemSchema.safeParse({
      albumId: "550e8400-e29b-41d4-a716-446655440000",
      type: "image",
      caption: "a".repeat(281),
    });
    expect(result.success).toBe(false);
  });
});

describe("rejectReasonSchema", () => {
  it("menolak alasan kosong", () => {
    expect(rejectReasonSchema.safeParse({ reason: "" }).success).toBe(false);
  });

  it("menolak alasan terlalu pendek (di bawah 10 karakter)", () => {
    expect(rejectReasonSchema.safeParse({ reason: "singkat" }).success).toBe(false);
  });

  it("menerima alasan yang layak", () => {
    expect(
      rejectReasonSchema.safeParse({ reason: "Foto buram dan tidak sesuai tema album." }).success,
    ).toBe(true);
  });
});
