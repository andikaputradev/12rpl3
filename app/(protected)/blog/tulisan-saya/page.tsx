import type { Metadata } from "next";
import Link from "next/link";
import { MyPostsList } from "@/components/blog/my-posts-list";
import { Button } from "@/components/ui/button";
import { getMyPosts } from "@/lib/actions/blog";
import { requireAuthenticatedUser } from "@/lib/actions/guard";

export const metadata: Metadata = {
  title: "Tulisan Saya",
  robots: { index: false, follow: false },
};

const STAFF_ROLES = new Set(["super_admin", "wali_kelas", "pengurus"]);

export default async function TulisanSayaPage() {
  const { profile } = await requireAuthenticatedUser();
  const posts = await getMyPosts();

  return (
    <div className="container-portal py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p data-eyebrow>Blog Kelas</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Tulisan Saya</h1>
        </div>
        <Button asChild>
          <Link href="/blog/tulis">Tulis Artikel Baru</Link>
        </Button>
      </div>
      <div className="mt-8">
        <MyPostsList posts={posts} isStaff={STAFF_ROLES.has(profile.role)} />
      </div>
    </div>
  );
}
