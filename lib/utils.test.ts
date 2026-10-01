import { describe, expect, it } from "vitest";
import { cn, getProgressPercent, getTimeRemaining, sanitizeUserText, slugify } from "./utils";

describe("getTimeRemaining", () => {
  it("menghitung selisih hari, jam, menit, detik dengan benar", () => {
    const from = new Date("2026-08-03T00:00:00Z");
    const target = new Date("2026-08-05T02:03:04Z");
    const result = getTimeRemaining(target, from);

    expect(result.days).toBe(2);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(3);
    expect(result.seconds).toBe(4);
  });

  it("tidak menghasilkan nilai negatif ketika target sudah lewat", () => {
    const from = new Date("2026-08-05T00:00:00Z");
    const target = new Date("2026-08-01T00:00:00Z");
    const result = getTimeRemaining(target, from);

    expect(result.totalMs).toBe(0);
    expect(result.days).toBe(0);
  });
});

describe("getProgressPercent", () => {
  it("mengembalikan 50 persen tepat di tengah rentang", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-03T00:00:00Z");
    const now = new Date("2026-01-02T00:00:00Z");

    expect(getProgressPercent(start, end, now)).toBe(50);
  });

  it("membatasi hasil pada rentang 0-100", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-03T00:00:00Z");

    expect(getProgressPercent(start, end, new Date("2025-01-01T00:00:00Z"))).toBe(0);
    expect(getProgressPercent(start, end, new Date("2027-01-01T00:00:00Z"))).toBe(100);
  });
});

describe("cn", () => {
  it("menggabungkan className dan menyelesaikan konflik Tailwind", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("sanitizeUserText", () => {
  it("menghapus tag HTML dari input", () => {
    // biome-ignore lint/security/noSecrets: contoh payload XSS untuk uji sanitasi, bukan kredensial.
    expect(sanitizeUserText("Halo <script>alert(1)</script> dunia", 100)).toBe(
      "Halo alert(1) dunia",
    );
  });

  it("memangkas sesuai panjang maksimum", () => {
    expect(sanitizeUserText("a".repeat(20), 5)).toHaveLength(5);
  });

  it("menghapus spasi di awal/akhir setelah dibersihkan", () => {
    expect(sanitizeUserText("  teks bersih  ", 100)).toBe("teks bersih");
  });
});

describe("slugify", () => {
  it("mengubah nama menjadi slug huruf kecil bertanda hubung", () => {
    expect(slugify("Study Tour Yogyakarta 2026")).toBe("study-tour-yogyakarta-2026");
  });

  it("menghapus diakritik/aksen", () => {
    expect(slugify("Café René")).toBe("cafe-rene");
  });

  it("menghapus karakter non-alfanumerik", () => {
    expect(slugify("Kelas XII RPL 3!!")).toBe("kelas-xii-rpl-3");
  });
});
