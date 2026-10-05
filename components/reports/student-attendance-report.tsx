import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { AttendanceLogEntry, AttendanceSummary } from "@/lib/actions/akademik";
import type { AttendanceStatus } from "@/lib/db/schema";
import { formatIndonesianDate } from "@/lib/utils";

interface StudentAttendanceReportProps {
  student: {
    fullName: string;
    nis?: string | null;
    absenNumber?: number | null;
  };
  summary: AttendanceSummary;
  log: AttendanceLogEntry[];
  waliKelasName?: string | null;
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};

export function StudentAttendanceReport({
  student,
  summary,
  log,
  waliKelasName = "Wali Kelas XII RPL 3",
}: StudentAttendanceReportProps) {
  const totalDays = summary.hadir + summary.sakit + summary.izin + summary.alpa;
  const attendanceRate = totalDays > 0 ? Math.round((summary.hadir / totalDays) * 100) : 100;
  const isEligible = attendanceRate >= 85;

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Lembar Rekapitulasi Presensi Siswa"
        documentSubtitle="Laporan Kedisiplinan & Kehadiran Belajar Siswa"
        documentNumber="421.3 / REKAP-PRES-SISWA / XII-RPL3 / 2026"
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
            <span className="w-32 font-semibold text-neutral-800">Tahun Ajaran</span>
            <span className="font-medium text-neutral-950">: 2026/2027 (Semester Ganjil)</span>
          </div>
        </div>
      </div>

      {/* Kotak Ringkasan Kehadiran & Status Kelayakan Ujian */}
      <div className="border border-black p-3 my-4 bg-neutral-50/50">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900">
          Akumulasi Rekapitulasi Kehadiran
        </h4>

        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-neutral-700">Total Hari Efektif</span>
            <span className="font-bold text-base text-neutral-950">{totalDays} Hari</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-emerald-800">Hadir</span>
            <span className="font-bold text-base text-emerald-950">{summary.hadir} Hari</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-amber-800">Sakit</span>
            <span className="font-bold text-base text-amber-950">{summary.sakit} Hari</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-sky-800">Izin</span>
            <span className="font-bold text-base text-sky-950">{summary.izin} Hari</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-rose-800">Alpa</span>
            <span className="font-bold text-base text-rose-950">{summary.alpa} Hari</span>
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-black/30 pt-3 gap-2">
          <div>
            <p className="text-xs text-neutral-800">
              Persentase Kehadiran Fisik:{" "}
              <strong className="text-neutral-950 font-bold text-sm">{attendanceRate}%</strong>
            </p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Standar minimal kehadiran sekolah untuk syarat kelayakan ujian semester adalah 85%.
            </p>
          </div>

          <div
            className={`border-2 border-black px-4 py-1.5 rounded-xs font-bold text-xs uppercase ${
              isEligible ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"
            }`}
          >
            {isEligible ? "Memenuhi Syarat Ujian" : "Tidak Memenuhi Syarat Ujian"}
          </div>
        </div>
      </div>

      {/* Riwayat Detail Ketidakhadiran / Catatan Khusus */}
      <div className="my-4">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900">
          Riwayat Riil Catatan Kehadiran Siswa
        </h4>

        {log.length === 0 ? (
          <p className="border border-black p-4 text-center text-neutral-600 bg-neutral-50/50">
            Belum ada catatan ketidakhadiran (kehadiran 100% sempurna).
          </p>
        ) : (
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-neutral-200/90 text-neutral-900 font-bold border-b border-black">
                <th className="border border-black py-1.5 px-2 w-10">No</th>
                <th className="border border-black py-1.5 px-3 text-left w-36">Tanggal</th>
                <th className="border border-black py-1.5 px-2 w-24">Status</th>
                <th className="border border-black py-1.5 px-3 text-left">
                  Keterangan / Catatan Surat
                </th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry, idx) => (
                <tr
                  key={entry.date}
                  className={entry.status !== "hadir" ? "bg-neutral-50 font-medium" : ""}
                >
                  <td className="border border-black py-1 px-2">{idx + 1}</td>
                  <td className="border border-black py-1 px-3 text-left font-mono">
                    {formatIndonesianDate(entry.date, true)}
                  </td>
                  <td className="border border-black py-1 px-2 font-semibold">
                    <span
                      className={
                        entry.status === "hadir"
                          ? "text-neutral-900"
                          : entry.status === "sakit"
                            ? "text-amber-800"
                            : entry.status === "izin"
                              ? "text-sky-800"
                              : "text-rose-800"
                      }
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </td>
                  <td className="border border-black py-1 px-3 text-left text-neutral-700 text-[11px]">
                    {entry.notes && entry.notes.trim() !== "" ? entry.notes : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
