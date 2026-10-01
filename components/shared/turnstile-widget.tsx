"use client";

import { useEffect, useId, useRef, useState } from "react";

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "auto" | "light" | "dark";
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  nonce: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
}

/**
 * Widget Cloudflare Turnstile mode explicit rendering (Bagian 3 & 9 prompt).
 * Script dimuat dengan atribut `nonce` (bukan lewat penambahan host ke
 * script-src) karena CSP proxy.ts memakai 'strict-dynamic': script bernonce
 * yang sudah dipercaya otomatis mewariskan kepercayaan ke resource yang
 * dimuatnya secara dinamis: pola resmi yang direkomendasikan Cloudflare
 * untuk CSP ber-strict-dynamic. frame-src tetap perlu ditambahkan terpisah
 * di proxy.ts karena strict-dynamic hanya berlaku untuk script, bukan iframe
 * (https://developers.cloudflare.com/turnstile/reference/content-security-policy/,
 * diperiksa 26 September 2026).
 */
export function TurnstileWidget({ nonce, onToken, onExpire }: TurnstileWidgetProps) {
  const containerId = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!scriptLoaded || !siteKey || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onToken,
      "error-callback": () => setScriptFailed(true),
      "expired-callback": () => onExpire?.(),
      theme: "auto",
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, onToken, onExpire]);

  if (!siteKey) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive-text text-sm">
          NEXT_PUBLIC_TURNSTILE_SITE_KEY belum diatur: widget verifikasi tidak dapat dimuat.
        </p>
      );
    }
    return null;
  }

  return (
    <div>
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        nonce={nonce}
        onLoad={() => setScriptLoaded(true)}
        onError={() => setScriptFailed(true)}
      />
      <div id={`turnstile-${containerId}`} ref={containerRef} />
      {scriptFailed && (
        <p className="mt-1 text-destructive-text text-sm">
          Widget verifikasi gagal dimuat. Muat ulang halaman.
        </p>
      )}
    </div>
  );
}
