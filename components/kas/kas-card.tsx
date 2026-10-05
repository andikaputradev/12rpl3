import Image from "next/image";
import { CopyableText } from "@/components/kas/copyable-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KasSettings } from "@/lib/db/schema";

export function KasCard({ settings }: { settings: KasSettings | null }) {
  const hasContent = settings && (settings.qrisImageUrl || settings.danaNumber);

  if (!hasContent) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted text-sm">
          Informasi kas digital belum diatur oleh Wali Kelas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {settings.qrisImageUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scan QRIS</CardTitle>
            <CardDescription>
              Buka aplikasi e-wallet atau m-banking, pindai kode di bawah ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-md border border-border bg-white p-3">
              <Image
                src={settings.qrisImageUrl}
                alt="Kode QRIS kas kelas"
                fill
                sizes="280px"
                className="object-contain"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {settings.danaNumber ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transfer ke DANA</CardTitle>
            <CardDescription>
              Atau kirim manual lewat aplikasi DANA ke nomor berikut.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-lg tracking-wide">{settings.danaNumber}</p>
                {settings.danaAccountName ? (
                  <p className="truncate text-muted text-xs">a.n. {settings.danaAccountName}</p>
                ) : null}
              </div>
              <CopyableText value={settings.danaNumber} label="nomor DANA" />
            </div>
            {settings.nominalInfo ? (
              <p className="text-sm">
                <span className="text-muted">Nominal: </span>
                {settings.nominalInfo}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {settings.instructions ? (
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Catatan</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-muted text-sm">
            {settings.instructions}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-[11px] text-muted sm:col-span-2">
        Pembayaran dilakukan manual di luar sistem ini - portal hanya menampilkan QRIS dan nomor
        tujuan, tanpa memproses atau mencatat transaksi.
      </p>
    </div>
  );
}
