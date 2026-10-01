import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = [
  "/akademik",
  "/kas",
  "/galeri/upload",
  "/galeri/kiriman-saya",
  "/portofolio",
  "/blog/tulis",
  "/blog/tulisan-saya",
  "/profil-saya",
  "/kelulusan/tulis-pesan",
];
const ADMIN_PREFIX = "/dashboard";

function buildCsp(nonce: string, isDev: boolean) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    // Radix UI (dipakai shadcn/ui untuk Dialog/DropdownMenu/Sheet) menulis
    // posisi popper via atribut style inline yang tidak bisa diberi nonce;
    // CSP tidak menyediakan mekanisme aman untuk kasus ini selain
    // unsafe-inline pada style-src-attr secara spesifik (elemen <style>
    // tetap dikunci nonce di atas).
    "style-src-attr 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://res.cloudinary.com https://img.youtube.com https://i.ytimg.com https://images.unsplash.com https://randomuser.me data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    // Fase 5: Cloudflare Turnstile (Bagian 3 & 9 prompt). script-src TIDAK
    // perlu ditambah challenges.cloudflare.com: script api.js dimuat dengan
    // atribut nonce (components/shared/turnstile-widget.tsx) yang sudah
    // dipercaya oleh 'strict-dynamic' di atas, pola resmi yang
    // direkomendasikan Cloudflare untuk CSP ber-strict-dynamic. frame-src
    // tetap wajib ditambah karena strict-dynamic hanya berlaku untuk script,
    // bukan iframe widget itu sendiri
    // (https://developers.cloudflare.com/turnstile/reference/content-security-policy/,
    // diperiksa 26 September 2026).
    "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

function redirectToLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("redirectTo", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const { response, userId } = await updateSession(request, requestHeaders);

  const { pathname } = request.nextUrl;

  // Optimistic check di layer proxy: hanya memverifikasi autentikasi, cepat
  // menolak yang jelas-jelas belum login. Otorisasi berbasis role sengaja
  // TIDAK diputuskan di sini — didelegasikan ke layout (`forbidden()`, respons
  // 403 semantik) dan ke RLS Postgres (default deny) sebagai lapis
  // otoritatif, sesuai panduan resmi Next.js bahwa proxy bukan pengganti
  // penuh authorization management.
  if (pathname.startsWith(ADMIN_PREFIX) || PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!userId) return applyCsp(redirectToLogin(request), csp);
  }

  return applyCsp(response, csp);
}

function applyCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        // biome-ignore lint/security/noSecrets: pola regex path matcher, bukan kredensial.
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
