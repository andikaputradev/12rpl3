import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getUpstashEnv } from "@/lib/env";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const env = getUpstashEnv();
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

let authLimiter: Ratelimit | null = null;
function getAuthLimiter(): Ratelimit {
  if (!authLimiter) {
    authLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      prefix: "ratelimit:auth",
      analytics: true,
    });
  }
  return authLimiter;
}

let publicWriteLimiter: Ratelimit | null = null;
function getPublicWriteLimiter(): Ratelimit {
  if (!publicWriteLimiter) {
    publicWriteLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      prefix: "ratelimit:write",
      analytics: true,
    });
  }
  return publicWriteLimiter;
}

let galleryUploadLimiter: Ratelimit | null = null;
function getGalleryUploadLimiter(): Ratelimit {
  if (!galleryUploadLimiter) {
    galleryUploadLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "ratelimit:gallery-upload",
      analytics: true,
    });
  }
  return galleryUploadLimiter;
}

let assignmentSubmissionLimiter: Ratelimit | null = null;
function getAssignmentSubmissionLimiter(): Ratelimit {
  if (!assignmentSubmissionLimiter) {
    assignmentSubmissionLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(20, "24 h"),
      prefix: "ratelimit:assignment-submit",
      analytics: true,
    });
  }
  return assignmentSubmissionLimiter;
}

let portfolioSubmissionLimiter: Ratelimit | null = null;
function getPortfolioSubmissionLimiter(): Ratelimit {
  if (!portfolioSubmissionLimiter) {
    portfolioSubmissionLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(5, "24 h"),
      prefix: "ratelimit:portfolio-submit",
      analytics: true,
    });
  }
  return portfolioSubmissionLimiter;
}

let blogPostLimiter: Ratelimit | null = null;
function getBlogPostLimiter(): Ratelimit {
  if (!blogPostLimiter) {
    blogPostLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "ratelimit:blog-post",
      analytics: true,
    });
  }
  return blogPostLimiter;
}

let commentLimiter: Ratelimit | null = null;
function getCommentLimiter(): Ratelimit {
  if (!commentLimiter) {
    commentLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      prefix: "ratelimit:blog-comment",
      analytics: true,
    });
  }
  return commentLimiter;
}

let guestbookIpLimiter: Ratelimit | null = null;
function getGuestbookIpLimiter(): Ratelimit {
  if (!guestbookIpLimiter) {
    guestbookIpLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "ratelimit:guestbook",
      analytics: true,
    });
  }
  return guestbookIpLimiter;
}

export type RateLimitOutcome = { limited: boolean; remaining?: number };

/**
 * Fail-open khusus untuk infrastruktur rate limiting: bila Redis tidak
 * terkonfigurasi/tidak terjangkau, permintaan tetap diteruskan (bukan
 * diblokir) agar gangguan pada Upstash tidak berubah menjadi outage total
 * pada seluruh endpoint auth. Ini berbeda dari pemeriksaan RBAC/RLS yang
 * selalu fail-closed. Setiap kegagalan dicatat di log server.
 */
async function limitWith(limiter: () => Ratelimit, identifier: string): Promise<RateLimitOutcome> {
  try {
    const { success, remaining } = await limiter().limit(identifier);
    return { limited: !success, remaining };
  } catch (error) {
    console.error("[rate-limit] Redis tidak tersedia, fail-open:", error);
    return { limited: false };
  }
}

export function limitAuthAttempt(identifier: string) {
  return limitWith(getAuthLimiter, identifier);
}

export function limitPublicWrite(identifier: string) {
  return limitWith(getPublicWriteLimiter, identifier);
}

export function limitGalleryUpload(identifier: string) {
  return limitWith(getGalleryUploadLimiter, identifier);
}

/** Identifier: userId siswa, BUKAN alamat IP — brief Bagian 9 secara eksplisit menetapkan batas "per siswa", bukan per jaringan. */
export function limitAssignmentSubmission(studentId: string) {
  return limitWith(getAssignmentSubmissionLimiter, studentId);
}

/** Fase 4 — mencegah spam antrean moderasi portofolio, per siswa. */
export function limitPortfolioSubmission(studentId: string) {
  return limitWith(getPortfolioSubmissionLimiter, studentId);
}

/** Fase 4 — mencegah spam draf/pengajuan artikel blog, per penulis. */
export function limitBlogPost(authorId: string) {
  return limitWith(getBlogPostLimiter, authorId);
}

/** Fase 4 — mencegah spam komentar, jendela pendek per pengguna. */
export function limitComment(userId: string) {
  return limitWith(getCommentLimiter, userId);
}

/**
 * Fase 5: Bagian 9 prompt: maksimum lima kiriman per IP per jam. SATU-
 * SATUNYA rate limiter ber-identifier alamat IP di seluruh proyek (seluruh
 * limiter lain di atas ber-identifier userId) karena buku tamu adalah satu-
 * satunya fitur tanpa akun; identifier userId tidak tersedia untuk pengunjung
 * anonim.
 */
export function limitGuestbookSubmission(ipAddress: string) {
  return limitWith(getGuestbookIpLimiter, ipAddress);
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
