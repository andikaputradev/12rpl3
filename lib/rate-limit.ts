import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMITS } from "@/lib/config/rate-limits";
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
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.auth.maxRequests, RATE_LIMITS.auth.window),
      prefix: RATE_LIMITS.auth.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.publicWrite.maxRequests,
        RATE_LIMITS.publicWrite.window,
      ),
      prefix: RATE_LIMITS.publicWrite.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.galleryUpload.maxRequests,
        RATE_LIMITS.galleryUpload.window,
      ),
      prefix: RATE_LIMITS.galleryUpload.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.assignmentSubmission.maxRequests,
        RATE_LIMITS.assignmentSubmission.window,
      ),
      prefix: RATE_LIMITS.assignmentSubmission.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.portfolioSubmission.maxRequests,
        RATE_LIMITS.portfolioSubmission.window,
      ),
      prefix: RATE_LIMITS.portfolioSubmission.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.blogPost.maxRequests,
        RATE_LIMITS.blogPost.window,
      ),
      prefix: RATE_LIMITS.blogPost.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.blogComment.maxRequests,
        RATE_LIMITS.blogComment.window,
      ),
      prefix: RATE_LIMITS.blogComment.prefix,
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
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.guestbookSubmission.maxRequests,
        RATE_LIMITS.guestbookSubmission.window,
      ),
      prefix: RATE_LIMITS.guestbookSubmission.prefix,
      analytics: true,
    });
  }
  return guestbookIpLimiter;
}

let aspirationLimiter: Ratelimit | null = null;
function getAspirationLimiter(): Ratelimit {
  if (!aspirationLimiter) {
    aspirationLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.aspirationSubmission.maxRequests,
        RATE_LIMITS.aspirationSubmission.window,
      ),
      prefix: RATE_LIMITS.aspirationSubmission.prefix,
      analytics: true,
    });
  }
  return aspirationLimiter;
}

let pesanKesanLimiter: Ratelimit | null = null;
function getPesanKesanLimiter(): Ratelimit {
  if (!pesanKesanLimiter) {
    pesanKesanLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.pesanKesanSubmission.maxRequests,
        RATE_LIMITS.pesanKesanSubmission.window,
      ),
      prefix: RATE_LIMITS.pesanKesanSubmission.prefix,
      analytics: true,
    });
  }
  return pesanKesanLimiter;
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

/** Identifier: userId siswa, BUKAN alamat IP. */
export function limitAssignmentSubmission(studentId: string) {
  return limitWith(getAssignmentSubmissionLimiter, studentId);
}

/** Fase 4: Mencegah spam antrean moderasi portofolio, per siswa. */
export function limitPortfolioSubmission(studentId: string) {
  return limitWith(getPortfolioSubmissionLimiter, studentId);
}

/** Fase 4: Mencegah spam draf/pengajuan artikel blog, per penulis. */
export function limitBlogPost(authorId: string) {
  return limitWith(getBlogPostLimiter, authorId);
}

/** Fase 4: Mencegah spam komentar, jendela pendek per pengguna. */
export function limitComment(userId: string) {
  return limitWith(getCommentLimiter, userId);
}

/**
 * Fase 5: Maksimum lima kiriman per IP per jam.
 * Satu-satunya rate limiter ber-identifier alamat IP di seluruh proyek interaksi.
 */
export function limitGuestbookSubmission(ipAddress: string) {
  return limitWith(getGuestbookIpLimiter, ipAddress);
}

/** Fase 5: Batas aspirasi per siswa per 24 jam. */
export function limitAspirationSubmission(studentId: string) {
  return limitWith(getAspirationLimiter, studentId);
}

/** Fase 5: Batas pesan-kesan per siswa per 24 jam. */
export function limitPesanKesanSubmission(studentId: string) {
  return limitWith(getPesanKesanLimiter, studentId);
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
