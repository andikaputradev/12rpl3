import type { Metadata } from "next";
import { BulkGradeEntryTable } from "@/components/admin/bulk-grade-entry-table";
import { SubjectManagerDialog } from "@/components/admin/subject-manager-dialog";
import { getSubjects } from "@/lib/actions/jadwal";

export const metadata: Metadata = {
  title: "Entry Nilai — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNilaiPage() {
  const subjects = await getSubjects();

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p data-eyebrow>Dashboard Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Entry Nilai Massal
          </h1>
          <p className="mt-1 max-w-2xl text-muted text-sm">
            Pilih mata pelajaran, jenis penilaian, dan semester, lalu simpan seluruh baris
            sekaligus. Setiap perubahan tercatat individual di Audit Log.
          </p>
        </div>
        <SubjectManagerDialog subjects={subjects} />
      </header>

      {subjects.length === 0 ? (
        <p className="rounded-md border border-border border-dashed py-12 text-center text-muted text-sm">
          Belum ada mata pelajaran terdaftar. Tambahkan lewat migrasi data atau seed database
          terlebih dahulu.
        </p>
      ) : (
        <BulkGradeEntryTable subjects={subjects} />
      )}
    </div>
  );
}
