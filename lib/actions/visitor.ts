"use server";

import { cookies, headers } from "next/headers";
import { getClientIp, limitPublicWrite } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const VISITOR_COOKIE = "xrpl3_visited";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24;

export async function incrementVisitorOnce(): Promise<void> {
  const cookieStore = await cookies();

  // Pengecekan ulang di sisi server (bukan hanya mengandalkan client tidak
  // memanggil dua kali) — cookie httpOnly tidak bisa dibaca/dimanipulasi JS.
  if (cookieStore.get(VISITOR_COOKIE)) return;

  const ip = getClientIp(await headers());
  const { limited } = await limitPublicWrite(`visitor:${ip}`);
  if (limited) return;

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.rpc("increment_visitor_count");
  } catch (error) {
    console.error("[visitor] Gagal memanggil increment_visitor_count:", error);
    return;
  }

  cookieStore.set(VISITOR_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function hasCountedVisit(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(VISITOR_COOKIE));
}
