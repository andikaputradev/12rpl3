import type { Metadata } from "next";
import { AssignmentCard } from "@/components/akademik/assignment-card";
import { getAssignments } from "@/lib/actions/akademik";

export const metadata: Metadata = {
  title: "Bank Tugas",
  robots: { index: false, follow: false },
};

export default async function TugasPage() {
  const assignments = await getAssignments();

  return (
    <div className="container-portal py-16">
      <p data-eyebrow>Akademik</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Bank Tugas</h1>
      <p className="mt-3 text-muted">
        Kumpulkan berkas tugas (gambar atau PDF) sebelum tenggat. Kirim ulang akan menimpa kiriman
        sebelumnya.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {assignments.length === 0 ? (
          <p className="rounded-md border border-border border-dashed py-12 text-center text-muted text-sm">
            Belum ada tugas.
          </p>
        ) : (
          assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))
        )}
      </div>
    </div>
  );
}
