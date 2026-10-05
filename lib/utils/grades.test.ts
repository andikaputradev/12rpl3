import { describe, expect, it } from "vitest";
import { calculateSubjectAverage, hasAnyScore } from "@/lib/utils/grades";

describe("calculateSubjectAverage", () => {
  it("mengembalikan null jika belum ada nilai sama sekali", () => {
    expect(calculateSubjectAverage({})).toBeNull();
  });

  it("menghitung rata-rata hanya dari jenis penilaian yang tersedia", () => {
    expect(calculateSubjectAverage({ tugas: 80, uts: 90 })).toBe(85);
  });

  it("tidak memperlakukan jenis penilaian kosong sebagai nol", () => {
    // Rata-rata (80+90)/2, BUKAN (80+90+0+0)/4 - perbedaan ini krusial
    // karena kesalahan di sini membuat siswa terlihat gagal padahal
    // sebagian penilaian memang belum berlangsung.
    const withTwo = calculateSubjectAverage({ tugas: 80, uts: 90 });
    const withFourZeroed = (80 + 90 + 0 + 0) / 4;
    expect(withTwo).not.toBe(withFourZeroed);
    expect(withTwo).toBe(85);
  });

  it("membulatkan ke satu desimal", () => {
    expect(calculateSubjectAverage({ tugas: 80, uts: 85, uas: 90 })).toBe(85);
    expect(calculateSubjectAverage({ tugas: 70, uts: 80, uas: 90 })).toBe(80);
    expect(calculateSubjectAverage({ tugas: 75, uts: 80 })).toBe(77.5);
    expect(calculateSubjectAverage({ tugas: 70, uts: 75, uas: 80 })).toBe(75);
    expect(calculateSubjectAverage({ tugas: 70, uts: 71, uas: 75 })).toBe(72);
  });

  it("menangani seluruh empat jenis penilaian sekaligus", () => {
    expect(calculateSubjectAverage({ tugas: 80, uts: 85, uas: 90, praktik: 95 })).toBe(87.5);
  });

  it("menangani skor nol sebagai nilai valid (bukan kekosongan)", () => {
    expect(calculateSubjectAverage({ tugas: 0, uts: 100 })).toBe(50);
  });
});

describe("hasAnyScore", () => {
  it("false untuk objek kosong", () => {
    expect(hasAnyScore({})).toBe(false);
  });

  it("true jika minimal satu jenis penilaian terisi, termasuk nol", () => {
    expect(hasAnyScore({ tugas: 0 })).toBe(true);
    expect(hasAnyScore({ uas: 88 })).toBe(true);
  });
});
