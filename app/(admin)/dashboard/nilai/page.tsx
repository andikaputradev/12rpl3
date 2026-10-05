import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BulkGradeEntryTable } from "@/components/admin/bulk-grade-entry-table";
import { SubjectManagerDialog } from "@/components/admin/subject-manager-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSubjects } from "@/lib/actions/jadwal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entry Nilai | Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNilaiPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle<{ role: string }>();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "wali_kelas")) {
    return (
      <div className="container-portal py-16 flex justify-center">
        <Card className="max-w-md w-full border-border p-6 text-center">
          <CardContent className="flex flex-col items-center gap-3 pt-4">
            <div className="rounded-full bg-accent/15 p-3 text-accent-text">
              <GraduationCap className="size-8" />
            </div>
            <h2 className="font-display text-lg font-semibold">Akses Terbatas: Wali Kelas</h2>
            <p className="text-sm text-muted">
              Modul entry nilai akademik hanya diperuntukkan bagi Wali Kelas dan Administrator
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
