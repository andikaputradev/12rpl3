"use server";

import { type BlogPostSummary, getPublishedPosts } from "@/lib/actions/blog";

export async function fetchMorePosts(
  categorySlug: string | undefined,
  tag: string | undefined,
  cursor: string,
): Promise<{ posts: BlogPostSummary[]; nextCursor: string | null }> {
  return getPublishedPosts(categorySlug, tag, cursor);
}
