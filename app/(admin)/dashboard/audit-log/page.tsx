import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { type AuditLogEntryView, getGradeAttendanceAuditLog } from "@/lib/actions/admin-akademik";

export const metadata: Metadata = {
  title: "Audit Log Nilai & Absensi — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  let entries: AuditLogEntryView[];
  try {
    entries = await getGradeAttendanceAuditLog(100);
  } catch {
    // super_admin SAJA (Bagian 7 brief) — wali_kelas dan pengurus ditolak.
    forbidden();
  }

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin · Super Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Audit Log Nilai & Absensi
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Riwayat kronologis perubahan nilai dan absensi — mekanisme akuntabilitas untuk melindungi
          siswa maupun Wali Kelas dari sengketa data.
        </p>
      </header>

      <AuditLogTable entries={entries} />
    </div>
  );
}
