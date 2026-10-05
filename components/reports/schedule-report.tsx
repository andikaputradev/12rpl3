import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { PiketDay, ScheduleEntry } from "@/lib/actions/jadwal";
import type { DayOfWeek } from "@/lib/db/schema";

const DAY_LABELS: Record<DayOfWeek, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};

const DAYS_ORDER: DayOfWeek[] = ["senin", "selasa", "rabu", "kamis", "jumat"];

interface ScheduleReportProps {
  schedule: ScheduleEntry[];
  piket: PiketDay[];
  waliKelasName?: string | null;
  ketuaKelasName?: string | null;
}

export function ScheduleReport({
  schedule,
  piket,
  waliKelasName = "Wali Kelas XII RPL 3",
  ketuaKelasName = "Ketua Kelas XII RPL 3",
}: ScheduleReportProps) {
  // Group schedule by day
  const scheduleByDay = new Map<DayOfWeek, ScheduleEntry[]>();
  for (const day of DAYS_ORDER) {
    scheduleByDay.set(day, []);
  }
  for (const item of schedule) {
    const list = scheduleByDay.get(item.dayOfWeek);
    if (list) list.push(item);
  }
  for (const [, list] of scheduleByDay) {
    list.sort((a, b) => a.periodNumber - b.periodNumber);
  }

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Jadwal Pembelajaran & Piket Kebersihan Kelas"
        documentSubtitle="Kurikulum Operasional Satuan Pendidikan (KOSP) Tahun Pelajaran 2026/2027"
        documentNumber="421.3 / JADWAL-KBM / XII-RPL3 / 2026"
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
            <span className="w-32 font-semibold text-neutral-800">Ruang Kelas Utama</span>
            <span className="font-medium text-neutral-950">: Lab RPL 3 / Gedung C Lt. 2</span>
          </div>
        </div>
      </div>

      {/* Tabel Jadwal Pelajaran Mingguan */}
      <div className="my-4">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900 border-b border-black/30 pb-1">
          Jadwal Pelajaran Mingguan (Senin - Jumat)
        </h4>

        <div className="grid grid-cols-5 gap-2">
          {DAYS_ORDER.map((day) => {
            const items = scheduleByDay.get(day) ?? [];
            return (
              <div key={day} className="border border-black flex flex-col">
                <div className="bg-neutral-200/90 text-neutral-900 font-bold text-center py-1.5 border-b border-black text-xs uppercase">
                  {DAY_LABELS[day]}
                </div>
                <div className="p-1.5 space-y-1.5 flex-1 bg-white">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 text-center py-4 italic">
                      Tidak ada jam KBM
                    </p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-neutral-300 p-1.5 rounded-xs bg-neutral-50/70 text-[10px]"
                      >
                        <div className="font-mono text-[9px] text-neutral-600 font-semibold">
                          Jam ke-{item.periodNumber} ({item.startTime} - {item.endTime})
                        </div>
                        <div className="font-bold text-neutral-950 mt-0.5 leading-tight">
                          {item.subjectName ?? "Mata Pelajaran"}
                        </div>
                        {item.teacherName && (
                          <div className="text-neutral-700 text-[9px] mt-0.5 truncate">
                            {item.teacherName}
                          </div>
                        )}
                        {item.room && (
                          <div className="text-neutral-600 text-[9px]">R: {item.room}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Jadwal Piket Kebersihan Harian */}
      <div className="my-5 break-inside-avoid print:break-inside-avoid">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900 border-b border-black/30 pb-1">
          Jadwal Piket Kebersihan Kelas Harian
        </h4>

        <div className="grid grid-cols-5 gap-2">
          {DAYS_ORDER.map((day) => {
            const dayPiket = piket.find((p) => p.dayOfWeek === day);
            const studentList = dayPiket?.students ?? [];

            return (
              <div key={day} className="border border-black flex flex-col">
                <div className="bg-neutral-200/90 text-neutral-900 font-bold text-center py-1.5 border-b border-black text-xs uppercase">
                  {DAY_LABELS[day]}
                </div>
                <div className="p-2 flex-1 bg-white text-[11px]">
                  {studentList.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 text-center py-2 italic">
                      Belum ditetapkan
                    </p>
                  ) : (
                    <ol className="list-decimal pl-4 space-y-1">
                      {studentList.map((st) => (
                        <li key={st.id} className="font-medium text-neutral-900 leading-tight">
                          {st.fullName}
                        </li>
                      ))}
                    </ol>
                  )}
                  {dayPiket?.note && (
                    <div className="mt-2 pt-1 border-t border-neutral-200 text-[10px] text-neutral-600 italic">
                      {dayPiket.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
