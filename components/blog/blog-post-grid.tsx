"use client";

import { useState, useTransition } from "react";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { Button } from "@/components/ui/button";
import type { BlogPostSummary } from "@/lib/actions/blog";
import { fetchMorePosts } from "@/lib/actions/blog-client";

export function BlogPostGrid({
  initialPosts,
  initialNextCursor,
  categorySlug,
  tag,
}: {
  initialPosts: BlogPostSummary[];
  initialNextCursor: string | null;
  categorySlug?: string;
  tag?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!nextCursor) return;
    startTransition(async () => {
      const result = await fetchMorePosts(categorySlug, tag, nextCursor);
      setPosts((prev) => [...prev, ...result.posts]);
      setNextCursor(result.nextCursor);
    });
  }

  if (posts.length === 0) {
    return (
      <p className="rounded-md border border-border border-dashed py-16 text-center text-muted text-sm">
        Belum ada artikel untuk filter ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
      {nextCursor ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" disabled={isPending} onClick={handleLoadMore}>
            {isPending ? "Memuat..." : "Muat Lebih Banyak"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
