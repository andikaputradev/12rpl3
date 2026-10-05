import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { Profile } from "@/lib/db/schema";

interface StudentDirectoryReportProps {
  students: Profile[];
  waliKelasName?: string | null;
  ketuaKelasName?: string | null;
}

export function StudentDirectoryReport({
  students,
  waliKelasName = "Wali Kelas XII RPL 3",
  ketuaKelasName = "Ketua Kelas XII RPL 3",
}: StudentDirectoryReportProps) {
  const sorted = [...students].sort((a, b) => {
    if (a.absenNumber !== null && b.absenNumber !== null) {
      return a.absenNumber - b.absenNumber;
    }
    return a.fullName.localeCompare(b.fullName, "id");
  });

  const total = sorted.length;
  const maleCount = sorted.filter((s) => s.gender === "L").length;
  const femaleCount = sorted.filter((s) => s.gender === "P").length;

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Daftar Absensi & Biodata Siswa"
        documentSubtitle="Kelas XII Rekayasa Perangkat Lunak 3"
        documentNumber="421.3 / DIR-SISWA / XII-RPL3 / 2026"
      />

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 my-4 bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kelas</span>
            <span className="font-bold text-neutral-950">: XII RPL 3</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kompetensi Keahlian</span>
            <span className="font-medium text-neutral-950">: Rekayasa Perangkat Lunak</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Tahun Ajaran</span>
            <span className="font-medium text-neutral-950">: 2026/2027</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Rasio Siswa</span>
            <span className="font-medium text-neutral-950">
              : {maleCount} Laki-laki / {femaleCount} Perempuan (Total: {total})
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Direktori Siswa */}
      <table className="w-full border-collapse border border-black text-center my-4">
        <thead>
          <tr className="bg-neutral-200/90 text-neutral-900 font-bold border-b border-black">
            <th className="border border-black py-1.5 px-2 w-10">No</th>
            <th className="border border-black py-1.5 px-2 w-14">Absen</th>
            <th className="border border-black py-1.5 px-2 w-24">NIS</th>
            <th className="border border-black py-1.5 px-3 text-left">Nama Lengkap Siswa</th>
            <th className="border border-black py-1.5 px-2 w-14">L/P</th>
            <th className="border border-black py-1.5 px-3 text-left w-36">Jabatan / Peran</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, idx) => (
            <tr key={s.id}>
              <td className="border border-black py-1 px-2">{idx + 1}</td>
              <td className="border border-black py-1 px-2 font-mono">
                {s.absenNumber !== null ? String(s.absenNumber).padStart(2, "0") : "-"}
              </td>
              <td className="border border-black py-1 px-2 font-mono">{s.nis ?? "-"}</td>
              <td className="border border-black py-1 px-3 text-left font-medium">{s.fullName}</td>
              <td className="border border-black py-1 px-2 font-semibold">{s.gender ?? "-"}</td>
              <td className="border border-black py-1 px-3 text-left text-[11px] text-neutral-700">
                {s.jabatan ?? (s.role === "pengurus" ? "Pengurus Kelas" : "Anggota Siswa")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Lembar Pengesahan */}
      <ReportSignatureBlock
        leftRole="Ketua Kelas XII RPL 3"
        leftName={ketuaKelasName}
        leftIdLabel="NISN"
        leftIdValue="0061234567"
        rightRole="Wali Kelas XII RPL 3"
        rightName={waliKelasName}
        rightIdLabel="NIP"
        rightIdValue="19820514 200801 1 012"
      />
    </div>
  );
}
