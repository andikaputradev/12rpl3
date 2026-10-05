import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { AttendanceEntryRow } from "@/lib/actions/admin-akademik";
import type { AttendanceStatus } from "@/lib/db/schema";
import { formatIndonesianDate } from "@/lib/utils";

interface DailyAttendanceReportProps {
  date: string;
  sheet: AttendanceEntryRow[];
  statuses: Record<string, AttendanceStatus>;
  waliKelasName?: string | null;
  ketuaKelasName?: string | null;
}

const STATUS_PRINT_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir (H)",
  sakit: "Sakit (S)",
  izin: "Izin (I)",
  alpa: "Alpa (A)",
};

export function DailyAttendanceReport({
  date,
  sheet,
  statuses,
  waliKelasName = "Wali Kelas XII RPL 3",
  ketuaKelasName = "Ketua Kelas XII RPL 3",
}: DailyAttendanceReportProps) {
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  for (const row of sheet) {
    const st = statuses[row.studentId] ?? row.existingStatus ?? "hadir";
    if (st === "hadir") hadir++;
    else if (st === "sakit") sakit++;
    else if (st === "izin") izin++;
    else if (st === "alpa") alpa++;
  }

  const total = sheet.length;
  const attendanceRate = total > 0 ? Math.round((hadir / total) * 100) : 100;
  const formattedDate = formatIndonesianDate(date, true);

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Rekapitulasi Daftar Hadir Siswa Harian"
        documentSubtitle="Kelas XII Rekayasa Perangkat Lunak 3"
        documentNumber="421.3 / REKAP-ABS / XII-RPL3 / 2026"
      />

      {/* Metadata Dokumen */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 my-4 bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-28 font-semibold text-neutral-800">Hari, Tanggal</span>
            <span className="font-medium text-neutral-950">: {formattedDate}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold text-neutral-800">Kelas</span>
            <span className="font-medium text-neutral-950">: XII RPL 3</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold text-neutral-800">Kompetensi</span>
            <span className="font-medium text-neutral-950">: Rekayasa Perangkat Lunak</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-28 font-semibold text-neutral-800">Tahun Ajaran</span>
            <span className="font-medium text-neutral-950">: 2026/2027</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold text-neutral-800">Semester</span>
            <span className="font-medium text-neutral-950">: Ganjil</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold text-neutral-800">Total Siswa</span>
            <span className="font-medium text-neutral-950">: {total} Siswa Terdaftar</span>
          </div>
        </div>
      </div>

      {/* Tabel Absensi Seluruh Siswa */}
      <table className="w-full border-collapse border border-black text-center my-4">
        <thead>
          <tr className="bg-neutral-200/90 text-neutral-900 font-bold border-b border-black">
            <th className="border border-black py-1.5 px-2 w-10">No</th>
            <th className="border border-black py-1.5 px-2 w-14">Absen</th>
            <th className="border border-black py-1.5 px-3 text-left">Nama Lengkap Siswa</th>
            <th className="border border-black py-1.5 px-2 w-28">Status Kehadiran</th>
            <th className="border border-black py-1.5 px-3 text-left w-36">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {sheet.map((student, idx) => {
            const status = statuses[student.studentId] ?? student.existingStatus ?? "hadir";
            const isNotHadir = status !== "hadir";

            return (
              <tr
                key={student.studentId}
                className={isNotHadir ? "bg-neutral-100/70 font-medium" : ""}
              >
                <td className="border border-black py-1 px-2">{idx + 1}</td>
                <td className="border border-black py-1 px-2 font-mono">
                  {student.absenNumber !== null
                    ? String(student.absenNumber).padStart(2, "0")
                    : "-"}
                </td>
                <td className="border border-black py-1 px-3 text-left font-medium">
                  {student.fullName}
                </td>
                <td className="border border-black py-1 px-2 font-semibold">
                  <span
                    className={
                      status === "hadir"
                        ? "text-neutral-900"
                        : status === "sakit"
                          ? "text-amber-800 font-bold"
                          : status === "izin"
                            ? "text-sky-800 font-bold"
                            : "text-rose-800 font-bold"
                    }
                  >
                    {STATUS_PRINT_LABELS[status]}
                  </span>
                </td>
                <td className="border border-black py-1 px-3 text-left text-neutral-700 text-[11px]">
                  {status === "hadir" ? "Mengikuti KBM" : status.toUpperCase()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Ringkasan Headcount / Statistik Kehadiran Hari Ini */}
      <div className="border border-black p-3 my-4 bg-neutral-50/50 break-inside-avoid print:break-inside-avoid">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900">
          Ringkasan Statistik Kehadiran Harian
        </h4>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-neutral-700">Total Siswa</span>
            <span className="font-bold text-sm text-neutral-950">{total}</span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-emerald-800">Hadir</span>
            <span className="font-bold text-sm text-emerald-950">
              {hadir} ({total > 0 ? Math.round((hadir / total) * 100) : 0}%)
            </span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-amber-800">Sakit</span>
            <span className="font-bold text-sm text-amber-950">
              {sakit} ({total > 0 ? Math.round((sakit / total) * 100) : 0}%)
            </span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-sky-800">Izin</span>
            <span className="font-bold text-sm text-sky-950">
              {izin} ({total > 0 ? Math.round((izin / total) * 100) : 0}%)
            </span>
          </div>
          <div className="border border-black/40 p-2 rounded-xs bg-white">
            <span className="block font-semibold text-rose-800">Alpa</span>
            <span className="font-bold text-sm text-rose-950">
              {alpa} ({total > 0 ? Math.round((alpa / total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-neutral-700">
          Tingkat kehadiran kelas pada hari ini tercatat sebesar{" "}
          <strong className="text-neutral-950">{attendanceRate}%</strong>.
        </p>
      </div>

      {/* Lembar Pengesahan / Tanda Tangan */}
      <ReportSignatureBlock
        date={date}
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
