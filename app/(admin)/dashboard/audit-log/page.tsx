import { History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type AuditLogEntryView, getGradeAttendanceAuditLog } from "@/lib/actions/admin-akademik";

export const metadata: Metadata = {
  title: "Audit Log Nilai & Absensi | Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  let entries: AuditLogEntryView[];
  try {
    entries = await getGradeAttendanceAuditLog(100);
  } catch {
    return (
      <div className="container-portal py-16 flex justify-center">
        <Card className="max-w-md w-full border-border p-6 text-center">
          <CardContent className="flex flex-col items-center gap-3 pt-4">
            <div className="rounded-full bg-accent/15 p-3 text-accent-text">
              <History className="size-8" />
            </div>
            <h2 className="font-display text-lg font-semibold">Akses Terbatas: Super Admin</h2>
            <p className="text-sm text-muted">
              Audit log riwayat mutasi nilai dan absensi hanya dapat diakses oleh Administrator
              Sistem.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard">Kembali ke Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin · Super Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Audit Log Nilai & Absensi
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Riwayat kronologis perubahan nilai dan absensi sebagai mekanisme akuntabilitas untuk
          melindungi siswa maupun Wali Kelas dari sengketa data.
        </p>
      </header>

      <AuditLogTable entries={entries} />
    </div>
  );
}
