import { describe, expect, it } from "vitest";
import { academicEventSchema, classProfileSchema, highlightSchema } from "./admin-profil";

describe("classProfileSchema", () => {
  const valid = {
    motto: "Berkarya lewat kode, berkarakter lewat budaya.",
    sejarah: "A".repeat(60),
    visi: "Menjadi kelas RPL yang kolaboratif dan adaptif.",
    misi: ["Poin satu", "Poin dua"],
    tahunAjaran: "2026/2027",
  };

  it("menerima data lengkap dan valid", () => {
    expect(classProfileSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak format tahun ajaran yang salah", () => {
    const result = classProfileSchema.safeParse({ ...valid, tahunAjaran: "2026" });
    expect(result.success).toBe(false);
  });

  it("menolak misi kosong", () => {
    const result = classProfileSchema.safeParse({ ...valid, misi: [] });
    expect(result.success).toBe(false);
  });

  it("menolak sejarah terlalu pendek", () => {
    const result = classProfileSchema.safeParse({ ...valid, sejarah: "pendek" });
    expect(result.success).toBe(false);
  });
});

describe("highlightSchema - isActive boolean (regresi z.coerce.boolean)", () => {
  const base = {
    title: "Kunjungan Industri",
    description: "Deskripsi kegiatan kunjungan industri kelas.",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    displayOrder: 0,
  };

  it("menerima isActive: true (boolean asli)", () => {
    const result = highlightSchema.safeParse({ ...base, isActive: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
  });

  it("menerima isActive: false (boolean asli) - HARUS false, bukan ikut ter-coerce true", () => {
    const result = highlightSchema.safeParse({ ...base, isActive: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(false);
  });

  it("menolak URL gambar yang tidak valid", () => {
    const result = highlightSchema.safeParse({ ...base, imageUrl: "bukan-url", isActive: true });
    expect(result.success).toBe(false);
  });
});

describe("academicEventSchema", () => {
  it("menerima tanggal ISO dengan offset zona waktu", () => {
    const result = academicEventSchema.safeParse({
      title: "Ujian Akhir Sekolah",
      eventDate: "2027-05-15T08:00:00+07:00",
      isFeaturedCountdown: true,
    });
    expect(result.success).toBe(true);
  });

  it("menolak judul terlalu pendek", () => {
    const result = academicEventSchema.safeParse({
      title: "ab",
      eventDate: "2027-05-15T08:00:00+07:00",
      isFeaturedCountdown: false,
    });
    expect(result.success).toBe(false);
  });
});
