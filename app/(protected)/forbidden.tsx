import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProtectedForbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-surface">
        <ShieldAlert className="size-6 text-destructive-text" aria-hidden="true" />
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Error 403</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Akses ditolak</h1>
      <p className="max-w-sm text-sm text-muted">
        Peran akun Anda tidak memiliki akses ke halaman ini.
      </p>
      <Button asChild>
        <Link href="/" prefetch={false}>
          Kembali ke Beranda
        </Link>
      </Button>
    </div>
  );
}
