import type { Metadata } from "next";
import { StudentSearchGrid } from "@/components/direktori/student-search-grid";
import { getStudentList } from "@/lib/actions/direktori";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Direktori Siswa | ${siteConfig.className} ${siteConfig.schoolName}`,
  description: `Direktori siswa ${siteConfig.className}, ${siteConfig.schoolName}.`,
  alternates: { canonical: "/direktori" },
};

export default async function DirektoriPage() {
  const students = await getStudentList();

  return (
    <div className="container-portal py-20">
      <header className="max-w-xl">
        <p data-eyebrow>Direktori</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Direktori Siswa
        </h1>
        <p className="mt-3 text-muted">
          {students.length} siswa {siteConfig.className} ditampilkan secara publik.
        </p>
      </header>

      <div className="mt-10">
        <StudentSearchGrid students={students} />
      </div>
    </div>
  );
}
