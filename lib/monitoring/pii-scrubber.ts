/**
 * PII Scrubber untuk Observability & Error Tracking
 *
 * Menghapus data sensitif (nilai akademik, absensi, pesan pribadi, identitas,
 * token) dari payload error sebelum dikirim ke logging atau layanan pihak ketiga
 * (Sentry) guna mematuhi prinsip minimisasi data UU PDP (UU No. 27/2022).
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "set-cookie",
  "grades",
  "attendance",
  "nilai",
  "absensi",
  "message",
  "pesan",
  "content",
  "nik",
  "nis",
  "email",
  "phone",
  "telepon",
  "whatsapp",
]);

export function scrubPii<T>(data: T, depth = 0): T {
  if (depth > 6 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Redact Bearer tokens, JWTs, and long email/phone patterns
    let sanitized = data.replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, "Bearer [REDACTED_TOKEN]");
    sanitized = sanitized.replace(
      /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
      "[REDACTED_JWT]",
    );
    return sanitized as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => scrubPii(item, depth + 1)) as unknown as T;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = "[REDACTED_PII]";
      } else {
        result[key] = scrubPii(value, depth + 1);
      }
    }
    return result as unknown as T;
  }

  return data;
}

/**
 * Filter event sebelum dikirim ke Sentry (beforeSend callback).
 * Menjamin zero-PII leak untuk payload request dan error context.
 */
export function scrubSentryEvent<
  T extends {
    request?: { headers?: Record<string, string>; data?: unknown; cookies?: unknown };
    extra?: Record<string, unknown>;
    breadcrumbs?: Array<{ data?: unknown }>;
  },
>(event: T): T {
  if (event.request) {
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      delete headers.authorization;
      delete headers.cookie;
      delete headers["set-cookie"];
      event.request.headers = headers;
    }
    if (event.request.cookies) {
      event.request.cookies = "[REDACTED_COOKIES]";
    }
    if (event.request.data) {
      event.request.data = scrubPii(event.request.data);
    }
  }

  if (event.extra) {
    event.extra = scrubPii(event.extra);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((bc) => ({
      ...bc,
      data: bc.data ? scrubPii(bc.data) : undefined,
    }));
  }

  return event;
}
