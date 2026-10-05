import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { GradeRow } from "@/lib/actions/akademik";
import type { AssessmentType } from "@/lib/db/schema";

interface StudentGradeTranscriptReportProps {
  student: {
    fullName: string;
    nis?: string | null;
    absenNumber?: number | null;
  };
  semester: string;
  rows: GradeRow[];
  waliKelasName?: string | null;
  kkm?: number;
}

const ASSESSMENT_ORDER: AssessmentType[] = ["tugas", "uts", "uas", "praktik"];

export function StudentGradeTranscriptReport({
  student,
  semester,
  rows,
  waliKelasName = "Wali Kelas XII RPL 3",
  kkm = 75,
}: StudentGradeTranscriptReportProps) {
  const averages = rows.map((r) => r.average).filter((v): v is number => v !== null);
  const overallAverage =
    averages.length > 0
      ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10
      : 0;

  const passedCount = rows.filter((r) => r.average !== null && r.average >= kkm).length;
  const isAllPassed = rows.length > 0 && passedCount === rows.length;

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Kartu Hasil Studi (KHS) / Transkrip Nilai Siswa"
        documentSubtitle={`Laporan Hasil Belajar Semester - ${semester}`}
        documentNumber="421.3 / KHS / XII-RPL3 / 2026"
      />

      {/* Identitas Siswa */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 my-4 bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Nama Siswa</span>
            <span className="font-bold text-neutral-950 uppercase">: {student.fullName}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Nomor Induk (NIS)</span>
            <span className="font-medium text-neutral-950">: {student.nis ?? "-"}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Nomor Absen</span>
            <span className="font-medium text-neutral-950">
              :{" "}
              {student.absenNumber !== null && student.absenNumber !== undefined
                ? String(student.absenNumber).padStart(2, "0")
                : "-"}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kelas</span>
            <span className="font-medium text-neutral-950">: XII RPL 3</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kompetensi Keahlian</span>
            <span className="font-medium text-neutral-950">: Rekayasa Perangkat Lunak</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Semester / Tahun</span>
            <span className="font-medium text-neutral-950">: {semester}</span>
          </div>
        </div>
      </div>

      {/* Tabel Rincian Nilai Per Mata Pelajaran */}
      <table className="w-full border-collapse border border-black text-center my-4">
        <thead>
          <tr className="bg-neutral-200/90 text-neutral-900 font-bold border-b border-black">
            <th className="border border-black py-2 px-2 w-10">No</th>
            <th className="border border-black py-2 px-3 text-left">Mata Pelajaran</th>
            <th className="border border-black py-2 px-2 w-14">KKM</th>
            <th className="border border-black py-2 px-2 w-14">Tugas</th>
            <th className="border border-black py-2 px-2 w-14">UTS</th>
            <th className="border border-black py-2 px-2 w-14">UAS</th>
            <th className="border border-black py-2 px-2 w-14">Praktik</th>
            <th className="border border-black py-2 px-2 w-16">Nilai Akhir</th>
            <th className="border border-black py-2 px-2 w-20">Predikat</th>
            <th className="border border-black py-2 px-3 w-24">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="border border-black py-6 text-center text-neutral-600">
                Belum ada data nilai tercatat untuk semester ini.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const avg = row.average;
              const isPassed = avg !== null ? avg >= kkm : null;

              let predicate = "-";
              if (avg !== null) {
                if (avg >= 90) predicate = "A";
                else if (avg >= 80) predicate = "B";
                else if (avg >= 75) predicate = "C";
                else predicate = "D";
              }

              return (
                <tr key={row.subjectId} className={isPassed === false ? "bg-rose-50/60" : ""}>
                  <td className="border border-black py-1.5 px-2">{idx + 1}</td>
                  <td className="border border-black py-1.5 px-3 text-left font-medium">
                    {row.subjectName}
                  </td>
                  <td className="border border-black py-1.5 px-2 font-mono text-neutral-700">
                    {kkm}
                  </td>
                  {ASSESSMENT_ORDER.map((type) => (
                    <td key={type} className="border border-black py-1.5 px-2 tabular-nums">
                      {row.scores[type] !== undefined ? row.scores[type] : "-"}
                    </td>
                  ))}
                  <td className="border border-black py-1.5 px-2 font-bold tabular-nums">
                    {avg !== null ? avg : "-"}
                  </td>
                  <td className="border border-black py-1.5 px-2 font-bold">{predicate}</td>
                  <td className="border border-black py-1.5 px-3 font-semibold text-[11px]">
                    {isPassed === null ? (
                      <span className="text-neutral-500">Proses</span>
                    ) : isPassed ? (
                      <span className="text-emerald-800 font-bold">TUNTAS</span>
                    ) : (
                      <span className="text-rose-800 font-bold">REMEDIAL</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Ringkasan Indeks Prestasi & Ketercapaian */}
      <div className="border border-black p-3 my-4 bg-neutral-50/50 break-inside-avoid print:break-inside-avoid">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <p className="font-bold text-xs uppercase tracking-wider text-neutral-900">
              Capaian Hasil Belajar Semester
            </p>
            <p className="text-[11px] text-neutral-700">
              Total Mata Pelajaran:{" "}
              <strong className="text-neutral-950">{rows.length} Mapel</strong> | Mapel Tuntas KKM:{" "}
              <strong className="text-emerald-800">{passedCount} Mapel</strong>
            </p>
            <p className="text-[11px] text-neutral-700">
              Status Kelulusan Akademik Sementara:{" "}
              <strong
                className={isAllPassed ? "text-emerald-800 uppercase" : "text-amber-800 uppercase"}
              >
                {isAllPassed
                  ? "Memenuhi Kriteria Ketuntasan Minimal"
                  : "Terdapat Mata Pelajaran Dalam Pembinaan Remedial"}
              </strong>
            </p>
          </div>

          <div className="border-2 border-black p-3 bg-white text-center rounded-xs min-w-36">
            <span className="block text-[11px] font-semibold text-neutral-700 uppercase">
              Rata-rata Semester
            </span>
            <span className="block font-bold text-xl text-neutral-950 tabular-nums">
              {overallAverage}
            </span>
          </div>
        </div>

        {/* Catatan Pembinaan Wali Kelas */}
        <div className="mt-3 border-t border-black/30 pt-2 text-[11px]">
          <span className="font-semibold text-neutral-800">Catatan Pembinaan Wali Kelas:</span>
          <p className="text-neutral-700 italic mt-0.5">
            Pertahankan prestasi dan kedisiplinan belajar. Terus kembangkan kompetensi bidang
            rekayasa perangkat lunak dan portofolio keahlian untuk persiapan uji kompetensi kejuruan
            (UKK).
          </p>
        </div>
      </div>

      {/* Pengesahan Orang Tua & Wali Kelas */}
      <ReportSignatureBlock
        leftRole="Orang Tua / Wali Siswa"
        leftName="......................................................"
        leftIdLabel="No. Telp"
        leftIdValue="..................................."
        rightRole="Wali Kelas XII RPL 3"
        rightName={waliKelasName}
        rightIdLabel="NIP"
        rightIdValue="19820514 200801 1 012"
      />
    </div>
  );
}
