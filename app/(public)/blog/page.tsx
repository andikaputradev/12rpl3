import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostGrid } from "@/components/blog/blog-post-grid";
import { getBlogCategories, getPublishedPosts } from "@/lib/actions/blog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog Kelas",
  description: "Cerita, kegiatan, dan opini dari siswa-siswi Kelas XII RPL 3.",
};

interface BlogPageProps {
  searchParams: Promise<{ kategori?: string; tag?: string }>;
}

export default async function BlogListingPage({ searchParams }: BlogPageProps) {
  const { kategori, tag } = await searchParams;

  const [categories, result] = await Promise.all([
    getBlogCategories(),
    getPublishedPosts(kategori, tag),
  ]);

  return (
    <div className="container-portal py-16 sm:py-20">
      <p data-eyebrow>Blog Kelas</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Cerita dari Kelas Kami
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Ditulis oleh siswa, ditinjau sebelum tayang - kabar kegiatan, tutorial, dan opini dari Kelas
        XII RPL 3.
      </p>

      {categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] transition-colors",
              !kategori
                ? "border-accent bg-accent/12 text-accent-text"
                : "border-border text-muted hover:border-accent/50",
            )}
          >
            Semua
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?kategori=${category.slug}`}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] transition-colors",
                kategori === category.slug
                  ? "border-accent bg-accent/12 text-accent-text"
                  : "border-border text-muted hover:border-accent/50",
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}

      {tag ? (
        <p className="mt-4 text-muted text-sm">
          Tag: <span className="font-medium text-foreground">#{tag}</span>{" "}
          <Link
            href={kategori ? `/blog?kategori=${kategori}` : "/blog"}
            className="text-accent-text underline underline-offset-2"
          >
            Hapus filter
          </Link>
        </p>
      ) : null}

      <div className="mt-10">
        <BlogPostGrid
          initialPosts={result.posts}
          initialNextCursor={result.nextCursor}
          categorySlug={kategori}
          tag={tag}
        />
      </div>
    </div>
  );
}
