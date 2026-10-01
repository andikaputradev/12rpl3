import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { GradesTable } from "@/components/akademik/grades-table";
import { type GradeRow, getMyGrades } from "@/lib/actions/akademik";
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
  try {
    allRows = await getMyGrades();
  } catch {
    // Termasuk penolakan role pengurus (Bagian 9 brief) — forbidden()
    // menampilkan boundary 403 dari app/(protected)/forbidden.tsx.
    forbidden();
  }

  const semesters = [...new Set(allRows.map((row) => row.semester))].sort().reverse();
  const activeSemester =
    requestedSemester && semesters.includes(requestedSemester) ? requestedSemester : semesters[0];
  const rows = activeSemester ? allRows.filter((row) => row.semester === activeSemester) : [];

  return (
    <div className="container-portal py-16">
      <p data-eyebrow>Akademik</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Nilai</h1>
      <p className="mt-3 text-muted">Rekap nilai per mata pelajaran — hanya terlihat oleh Anda.</p>

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
