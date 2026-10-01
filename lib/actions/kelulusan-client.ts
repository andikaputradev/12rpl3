"use server";

import { getPesanKesanPublicFeed, type PesanKesanFeedPage } from "@/lib/actions/kelulusan";

/**
 * Jembatan client tipis (§6 brief): hanya membungkus pemanggilan
 * getPesanKesanPublicFeed (server-only di kelulusan.ts) untuk tombol "Muat
 * lebih banyak" di PesanKesanCard, pola identik fetchMorePosts pada
 * lib/actions/blog-client.ts.
 */
export async function fetchMorePesanKesan(cursor: string): Promise<PesanKesanFeedPage> {
  return getPesanKesanPublicFeed(cursor);
}
