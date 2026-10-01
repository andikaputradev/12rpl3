import { describe, expect, it } from "vitest";
import { deriveExcerpt } from "@/lib/utils/blog";

describe("deriveExcerpt", () => {
  it("membuang sintaks heading, bold, italic, dan tautan", () => {
    const markdown = "# Judul\n\nIni **tebal** dan _miring_ dengan [tautan](https://x.com).";
    expect(deriveExcerpt(markdown)).toBe("Judul Ini tebal dan miring dengan tautan.");
  });

  it("membuang blok kode dan gambar sepenuhnya, bukan menyisakan alt text mentah", () => {
    const markdown =
      "Teks awal.\n\n```js\nconst x = 1;\n```\n\n![alt gambar](https://x.com/a.png)\n\nTeks akhir.";
    const result = deriveExcerpt(markdown);
    expect(result).not.toContain("const x");
    expect(result).not.toContain("alt gambar");
    expect(result).toContain("Teks awal.");
    expect(result).toContain("Teks akhir.");
  });

  it("memotong dengan elipsis saat melebihi batas panjang", () => {
    const long = "kata ".repeat(100);
    const result = deriveExcerpt(long, 50);
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result.endsWith("…")).toBe(true);
  });

  it("tidak memotong bila sudah di bawah batas panjang", () => {
    expect(deriveExcerpt("Teks pendek.", 200)).toBe("Teks pendek.");
  });
});
