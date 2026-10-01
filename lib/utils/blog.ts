/**
 * Mengubah Markdown mentah menjadi teks polos ringkas untuk excerpt
 * otomatis saat penulis tidak mengisi ringkasan sendiri. Sengaja sederhana
 * (regex, bukan parser Markdown penuh) — hanya untuk potongan pratinjau,
 * BUKAN jalur render (itu tugas MarkdownRenderer + rehype-sanitize).
 */
export function deriveExcerpt(markdown: string, maxLength = 200): string {
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}
