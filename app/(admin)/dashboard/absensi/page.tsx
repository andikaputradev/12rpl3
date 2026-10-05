import type { Metadata } from "next";
import { BulkAttendanceEntryTable } from "@/components/admin/bulk-attendance-entry-table";

export const metadata: Metadata = {
  title: "Entry Absensi | Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminAbsensiPage() {
  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Entry Absensi Massal
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Pilih tanggal: seluruh siswa default "Hadir", tinggal ubah baris yang tidak hadir lalu
          simpan sekali.
        </p>
      </header>

      <BulkAttendanceEntryTable />
    </div>
  );
}
