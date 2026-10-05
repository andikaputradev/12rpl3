import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

describe("MarkdownRenderer - sanitasi XSS", () => {
  it("tidak mengeksekusi tag <script> yang disisipkan dalam sumber Markdown", () => {
    const { container } = render(
      <MarkdownRenderer content={"Halo <script>window.__xss = true;</script> dunia"} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("<script");
    // @ts-expect-error - properti global sengaja dibaca untuk membuktikan skrip TIDAK pernah jalan.
    expect(window.__xss).toBeUndefined();
  });

  it("membuang atribut event handler (onerror) pada img yang disisipkan sebagai HTML mentah", () => {
    const { container } = render(
      <MarkdownRenderer content={'<img src="x" onerror="window.__xss = true;">'} />,
    );
    expect(container.innerHTML).not.toContain("onerror");
    // @ts-expect-error - idem, membuktikan handler tidak pernah terpasang.
    expect(window.__xss).toBeUndefined();
  });

  it("menetralkan skema javascript: pada tautan bergaya Markdown murni", () => {
    const { container } = render(
      <MarkdownRenderer content={"[klik di sini](javascript:alert(document.cookie))"} />,
    );
    const link = container.querySelector("a");
    // hast-util-sanitize menghapus TOTAL atribut href yang skemanya tidak
    // diizinkan (bukan menyaringnya menjadi string aman) - getAttribute
    // karenanya mengembalikan null. Teks tautan tetap dirender.
    const href = link?.getAttribute("href");
    expect(!href || !/^javascript:/i.test(href)).toBe(true);
    expect(link?.textContent).toBe("klik di sini");
  });

  it("menetralkan skema javascript: pada gambar bergaya Markdown murni", () => {
    // biome-ignore lint/security/noSecrets: payload uji XSS berentropi tinggi, bukan kredensial sungguhan.
    const { container } = render(<MarkdownRenderer content={"![alt](javascript:alert(1))"} />);
    const img = container.querySelector("img");
    const src = img?.getAttribute("src");
    expect(!src || !/^javascript:/i.test(src)).toBe(true);
  });

  it("tetap merender Markdown aman apa adanya (regresi: sanitasi tidak boleh membuang konten sah)", () => {
    const { container, getByRole } = render(
      <MarkdownRenderer
        content={"# Judul\n\nParagraf **tebal** dan [tautan aman](https://example.com)."}
      />,
    );
    expect(getByRole("heading", { level: 1 }).textContent).toBe("Judul");
    expect(container.querySelector("strong")?.textContent).toBe("tebal");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
  });

  it("mendukung tabel GFM tanpa membuka celah lewat cell HTML mentah", () => {
    const markdown = [
      "| Kolom | Nilai |",
      "| --- | --- |",
      "| A | <script>window.__xss = true;</script> |",
    ].join("\n");
    const { container } = render(<MarkdownRenderer content={markdown} />);
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector("script")).toBeNull();
    // @ts-expect-error - idem.
    expect(window.__xss).toBeUndefined();
  });
});
