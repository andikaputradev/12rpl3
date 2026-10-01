import type { Metadata } from "next";
import { PortfolioSubmitForm } from "@/components/prestasi/portfolio-submit-form";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { getAllStudents } from "@/lib/actions/jadwal";

export const metadata: Metadata = {
  title: "Submit Portofolio",
  robots: { index: false, follow: false },
};

export default async function PortfolioSubmitPage() {
  const { userId } = await requireAuthenticatedUser();
  const students = await getAllStudents();
  const classmates = students.filter((student) => student.id !== userId);

  return (
    <div className="container-portal py-16">
      <p data-eyebrow>Portofolio</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Submit Proyek Kamu</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Ceritakan proyek RPL yang sudah kamu kerjakan. Proyek tampil publik di halaman Prestasi &
        Portofolio setelah disetujui staf.
      </p>
      <div className="mt-8 max-w-2xl">
        <PortfolioSubmitForm classmates={classmates} />
      </div>
    </div>
  );
}
