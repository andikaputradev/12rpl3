import type { Metadata } from "next";
import { AssignmentManager } from "@/components/admin/assignment-manager";
import { getAllAssignments } from "@/lib/actions/admin-akademik";
import { getSubjects } from "@/lib/actions/jadwal";

export const metadata: Metadata = {
  title: "Tugas — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTugasPage() {
  const [assignments, subjects] = await Promise.all([getAllAssignments(), getSubjects()]);

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Bank Tugas
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Tugas baru langsung tampil di /akademik/tugas untuk seluruh siswa.
        </p>
      </header>

      <AssignmentManager assignments={assignments} subjects={subjects} />
    </div>
  );
}
