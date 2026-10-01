"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Detail lengkap hanya di log server/observability; pesan ke pengguna
    // tetap generik agar tidak membocorkan informasi internal.
    console.error("[app-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-surface">
        <AlertTriangle className="size-6 text-destructive-text" aria-hidden="true" />
      </div>
      <h1 className="font-display text-3xl font-medium tracking-tight">Terjadi kesalahan</h1>
      <p className="max-w-sm text-sm text-muted">
        Sistem mengalami gangguan sementara. Silakan coba lagi beberapa saat lagi.
      </p>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  );
}
