import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { GradeEntryRow } from "@/lib/actions/admin-akademik";
import type { AssessmentType } from "@/lib/db/schema";

interface GradeLegerReportProps {
  subjectName: string;
  semester: string;
  activeAssessmentType?: AssessmentType;
  sheet: GradeEntryRow[];
  scores: Record<string, string>;
  waliKelasName?: string | null;
  teacherName?: string | null;
  kkm?: number;
}

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  praktik: "Praktik",
};

export function GradeLegerReport({
  subjectName,
  semester,
  activeAssessmentType = "tugas",
  sheet,
  scores,
  waliKelasName = "Wali Kelas XII RPL 3",
  teacherName = "Guru Mata Pelajaran",
  kkm = 75,
}: GradeLegerReportProps) {
  const validScores: number[] = [];
  let passedCount = 0;

  const rowsWithComputed = sheet.map((student, idx) => {
    const rawVal = (scores[student.studentId] ?? "").trim();
    const scoreVal =
      rawVal !== "" && !Number.isNaN(Number(rawVal))
        ? Number(rawVal)
        : student.existingScore !== null
          ? student.existingScore
          : null;

    if (scoreVal !== null) {
      validScores.push(scoreVal);
      if (scoreVal >= kkm) passedCount++;
    }

    let predicate = "-";
    if (scoreVal !== null) {
      if (scoreVal >= 90) predicate = "A (Sangat Baik)";
      else if (scoreVal >= 80) predicate = "B (Baik)";
      else if (scoreVal >= 75) predicate = "C (Cukup)";
      else predicate = "D (Perlu Bimbingan)";
    }

    return {
      index: idx + 1,
      studentId: student.studentId,
      absenNumber: student.absenNumber,
      fullName: student.fullName,
      score: scoreVal,
      predicate,
      isPassed: scoreVal !== null ? scoreVal >= kkm : null,
    };
  });

  const totalStudents = sheet.length;
  const filledCount = validScores.length;
  const avg =
    filledCount > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / filledCount) * 10) / 10
      : 0;
  const maxScore = filledCount > 0 ? Math.max(...validScores) : 0;
  const minScore = filledCount > 0 ? Math.min(...validScores) : 0;
  const passRate = filledCount > 0 ? Math.round((passedCount / filledCount) * 100) : 0;

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Leger Rekapitulasi Nilai Akademik"
        documentSubtitle={`Mata Pelajaran: ${subjectName}`}
        documentNumber="421.3 / LEGER-NILAI / XII-RPL3 / 2026"
      />

      {/* Metadata Dokumen */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 my-4 bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Mata Pelajaran</span>
            <span className="font-bold text-neutral-950">: {subjectName}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kelas</span>
            <span className="font-medium text-neutral-950">: XII RPL 3</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Asesmen Aktif</span>
            <span className="font-medium text-neutral-950">
              : Penilaian {ASSESSMENT_LABELS[activeAssessmentType]}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Semester</span>
            <span className="font-medium text-neutral-950">: {semester}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kriteria Ketuntasan (KKM)</span>
            <span className="font-bold text-neutral-950">: {kkm}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Status Data</span>
            <span className="font-medium text-neutral-950">
              : {filledCount} dari {totalStudents} Siswa Dinilai
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Leger Nilai */}
      <table className="w-full border-collapse border border-black text-center my-4">
        <thead>
          <tr className="bg-neutral-200/90 text-neutral-900 font-bold border-b border-black">
            <th className="border border-black py-1.5 px-2 w-10">No</th>
            <th className="border border-black py-1.5 px-2 w-14">Absen</th>
            <th className="border border-black py-1.5 px-3 text-left">Nama Lengkap Siswa</th>
            <th className="border border-black py-1.5 px-2 w-20">Nilai</th>
            <th className="border border-black py-1.5 px-2 w-32">Predikat</th>
            <th className="border border-black py-1.5 px-3 w-28">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rowsWithComputed.map((row) => (
            <tr key={row.studentId} className={row.isPassed === false ? "bg-rose-50/60" : ""}>
              <td className="border border-black py-1 px-2">{row.index}</td>
              <td className="border border-black py-1 px-2 font-mono">
                {row.absenNumber !== null ? String(row.absenNumber).padStart(2, "0") : "-"}
              </td>
              <td className="border border-black py-1 px-3 text-left font-medium">
                {row.fullName}
              </td>
              <td className="border border-black py-1 px-2 font-bold tabular-nums">
                {row.score !== null ? row.score : "-"}
              </td>
              <td className="border border-black py-1 px-2 text-[11px] font-medium">
                {row.predicate}
              </td>
              <td className="border border-black py-1 px-3 font-semibold text-[11px]">
                {row.isPassed === null ? (
                  <span className="text-neutral-500">Belum Ada</span>
                ) : row.isPassed ? (
                  <span className="text-emerald-800 font-bold">TUNTAS</span>
                ) : (
                  <span className="text-rose-800 font-bold">REMEDIAL</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ringkasan Statistik Kelas */}
      <div className="border border-black p-3 my-4 bg-neutral-50/50 break-inside-avoid print:break-inside-avoid">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900">
          Statistik Hasil Penilaian Kelas
        </h4>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-neutral-700">Rata-rata Kelas</span>
            <span className="font-bold text-sm text-neutral-950 tabular-nums">{avg}</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-emerald-800">Nilai Tertinggi</span>
            <span className="font-bold text-sm text-emerald-950 tabular-nums">{maxScore}</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-rose-800">Nilai Terendah</span>
            <span className="font-bold text-sm text-rose-950 tabular-nums">{minScore}</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-sky-800">Tuntas KKM (&ge;{kkm})</span>
            <span className="font-bold text-sm text-sky-950">{passedCount} Siswa</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-purple-800">Persentase Kelulusan</span>
            <span className="font-bold text-sm text-purple-950">{passRate}%</span>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-neutral-700">
          Catatan: Kriteria Ketuntasan Minimal (KKM) mata pelajaran ini adalah {kkm}. Siswa dengan
          predikat D wajib mengikuti program remedial terstruktur.
        </p>
      </div>

      {/* Lembar Pengesahan / Tanda Tangan */}
      <ReportSignatureBlock
        leftRole="Guru Pengampu Mata Pelajaran"
        leftName={teacherName}
        leftIdLabel="NIP"
        leftIdValue="19780820 200501 1 008"
        rightRole="Wali Kelas XII RPL 3"
        rightName={waliKelasName}
        rightIdLabel="NIP"
        rightIdValue="19820514 200801 1 012"
      />
    </div>
  );
}
