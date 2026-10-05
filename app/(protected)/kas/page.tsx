import type { Metadata } from "next";
import { KasCard } from "@/components/kas/kas-card";
import { KasReportModal } from "@/components/reports/kas-report-modal";
import { getWaliKelas } from "@/lib/actions/beranda";
import { getKasSettings } from "@/lib/actions/kas";

export const metadata: Metadata = {
  title: "Kas Kelas",
  robots: { index: false, follow: false },
};

export default async function KasPage() {
  const [settings, waliKelas] = await Promise.all([getKasSettings(), getWaliKelas()]);

  return (
    <div className="container-portal py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p data-eyebrow>Kas Kelas</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Kas Digital</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Scan kode QRIS atau transfer manual ke nomor DANA di bawah. Portal ini hanya menampilkan
            informasi tujuan pembayaran - tidak memproses transaksi apa pun.
          </p>
        </div>

        <div>
          <KasReportModal settings={settings} waliKelasName={waliKelas?.fullName} />
        </div>
      </div>

      <div className="mt-8">
        <KasCard settings={settings} />
      </div>
    </div>
  );
}
