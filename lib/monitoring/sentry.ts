import { scrubPii, scrubSentryEvent } from "./pii-scrubber";

export interface SentryDiagnosticPayload {
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Pelacakan error tingkat produksi dengan penyaringan PII otomatis.
 *
 * Bila SENTRY_DSN atau NEXT_PUBLIC_SENTRY_DSN tersedia, fungsi ini
 * menginisiasi transmisi aman ke Sentry menggunakan payload yang sudah
 * disaring. Bila belum dikonfigurasi, error disaring lalu dicatat ke log server
 * tanpa membocorkan nilai, absensi, atau isi pesan.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const isProd = process.env.NODE_ENV === "production";
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  const errorObj =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  const digest = (error as { digest?: string })?.digest;
  const scrubbedContext = context ? scrubPii(context) : undefined;

  const payload: SentryDiagnosticPayload = {
    name: errorObj.name,
    message: errorObj.message,
    stack: isProd ? undefined : errorObj.stack,
    digest,
    context: scrubbedContext,
    timestamp: new Date().toISOString(),
  };

  // Sebelum dikirim, lewatkan melalui scrubber lengkap
  const sanitized = scrubSentryEvent(payload as unknown as Parameters<typeof scrubSentryEvent>[0]);

  if (dsn) {
    // Sentry SDK integration bridge
    try {
      // Jika @sentry/nextjs terpasang di runtime
      const sentryGlobal = (
        globalThis as unknown as {
          Sentry?: { captureException: (err: unknown, ctx?: unknown) => void };
        }
      ).Sentry;
      if (sentryGlobal?.captureException) {
        sentryGlobal.captureException(errorObj, { extra: sanitized });
        return;
      }
    } catch {
      // Fallback ke server logging terstruktur
    }
  }

  // Fallback logging aman untuk server / browser console
  console.error(
    "[monitor-error]",
    JSON.stringify({
      digest: payload.digest ?? "no-digest",
      name: payload.name,
      context: payload.context,
    }),
  );
}
