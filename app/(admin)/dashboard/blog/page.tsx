import type { Metadata } from "next";
import { BlogCategoryManager } from "@/components/admin/blog-category-manager";
import { BlogModerationQueue } from "@/components/admin/blog-moderation-queue";
import { RecentCommentsPanel } from "@/components/admin/recent-comments-panel";
import { getPendingPosts, getRecentComments } from "@/lib/actions/admin-blog";
import { getBlogCategories } from "@/lib/actions/blog";

export const metadata: Metadata = {
  title: "Blog — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const [pendingPosts, categories, recentComments] = await Promise.all([
    getPendingPosts(),
    getBlogCategories(),
    getRecentComments(),
  ]);

  return (
    <div className="container-portal flex flex-col gap-10 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Blog
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Artikel yang diterbitkan langsung tampil di /blog untuk publik.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium">Antrean Tinjauan Artikel</h2>
        <BlogModerationQueue initialPosts={pendingPosts} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium">Kategori</h2>
        <BlogCategoryManager categories={categories} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium">Komentar Terbaru</h2>
        <RecentCommentsPanel comments={recentComments} />
      </section>
    </div>
  );
}
