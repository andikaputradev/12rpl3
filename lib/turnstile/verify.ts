import "server-only";
import { getTurnstileEnv } from "@/lib/env";

const SITEVERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileSiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes: string[];
}

/**
 * Verifikasi token widget Turnstile ke endpoint siteverify resmi Cloudflare
 * (Bagian 3 & 9 prompt Fase 5). Selalu memanggil host tetap
 * challenges.cloudflare.com: token dari client hanya diteruskan sebagai
 * nilai form field, bukan dipakai membentuk URL tujuan, sehingga tidak
 * membuka celah SSRF (pola sama seperti validateYoutubeUrl di
 * lib/youtube/oembed.ts). Kegagalan jaringan diperlakukan sebagai verifikasi
 * GAGAL (fail-closed): berbeda dari lib/rate-limit.ts yang fail-open,
 * karena ini satu-satunya lapis anti-bot di titik masuk sebelum honeypot dan
 * rate limit; fail-open di sini akan meniadakan gunanya CAPTCHA sepenuhnya.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerificationResult> {
  const env = getTurnstileEnv();

  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  if (remoteIp && remoteIp !== "unknown") {
    body.append("remoteip", remoteIp);
  }

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_ENDPOINT, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("[turnstile] Gagal menghubungi endpoint siteverify:", error);
    return { success: false, errorCodes: ["network-error"] };
  }

  if (!response.ok) {
    console.error(`[turnstile] Endpoint siteverify mengembalikan status ${response.status}.`);
    return { success: false, errorCodes: ["http-error"] };
  }

  const data = (await response.json()) as TurnstileSiteverifyResponse;
  return { success: data.success === true, errorCodes: data["error-codes"] ?? [] };
}
