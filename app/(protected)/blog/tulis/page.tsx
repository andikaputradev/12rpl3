import type { Metadata } from "next";
import { MarkdownEditor } from "@/components/blog/markdown-editor";
import { getBlogCategories } from "@/lib/actions/blog";
import { requireAuthenticatedUser } from "@/lib/actions/guard";

export const metadata: Metadata = {
  title: "Tulis Artikel",
  robots: { index: false, follow: false },
};

export default async function TulisArtikelPage() {
  await requireAuthenticatedUser();
  const categories = await getBlogCategories();

  return (
    <div className="container-portal max-w-3xl py-16">
      <p data-eyebrow>Blog Kelas</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Tulis Artikel</h1>
      <p className="mt-3 text-muted">
        Simpan sebagai draf terlebih dahulu - kirim untuk ditinjau atau terbitkan dari halaman
        "Tulisan Saya".
      </p>
      <div className="mt-8">
        <MarkdownEditor categories={categories} />
      </div>
    </div>
  );
}
