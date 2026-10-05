import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { GradesTable } from "@/components/akademik/grades-table";
import { StudentGradeModal } from "@/components/reports/student-grade-modal";
import { type GradeRow, getMyGrades } from "@/lib/actions/akademik";
import { getWaliKelas } from "@/lib/actions/beranda";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nilai",
  robots: { index: false, follow: false },
};

export default async function NilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  const { semester: requestedSemester } = await searchParams;

  let allRows: GradeRow[];
  let currentProfile: Awaited<ReturnType<typeof requireAuthenticatedUser>>["profile"];
  let waliKelasName: string | null = null;

  try {
    const [{ profile }, wali, gradesData] = await Promise.all([
      requireAuthenticatedUser(),
      getWaliKelas(),
      getMyGrades(),
    ]);
    currentProfile = profile;
    waliKelasName = wali?.fullName ?? null;
    allRows = gradesData;
  } catch {
    // Termasuk penolakan role pengurus (Bagian 9 brief) - forbidden()
    // menampilkan boundary 403 dari app/(protected)/forbidden.tsx.
    forbidden();
  }

  const semesters = [...new Set(allRows.map((row) => row.semester))].sort().reverse();
  const activeSemester =
    requestedSemester && semesters.includes(requestedSemester)
      ? requestedSemester
      : (semesters[0] ?? "Ganjil 2026/2027");
  const rows = activeSemester ? allRows.filter((row) => row.semester === activeSemester) : [];

  return (
    <div className="container-portal py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p data-eyebrow>Akademik</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Nilai Saya</h1>
          <p className="mt-3 text-muted">
            Rekap nilai per mata pelajaran - hanya terlihat oleh Anda dan Wali Kelas.
          </p>
        </div>

        <div>
          <StudentGradeModal
            student={{
              fullName: currentProfile.fullName,
              nis: currentProfile.nis,
              absenNumber: currentProfile.absenNumber,
            }}
            semester={activeSemester}
            rows={rows}
            waliKelasName={waliKelasName}
          />
        </div>
      </div>

      {semesters.length > 1 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {semesters.map((sem) => (
            <Link
              key={sem}
              href={`/akademik/nilai?semester=${encodeURIComponent(sem)}`}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] transition-colors",
                sem === activeSemester
                  ? "border-accent bg-accent/12 text-accent-text"
                  : "border-border text-muted hover:border-accent/50",
              )}
            >
              {sem}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <GradesTable rows={rows} />
      </div>
    </div>
  );
}
