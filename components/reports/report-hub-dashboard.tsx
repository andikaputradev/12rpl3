"use client";

import {
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  Printer,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceReportModal } from "@/components/reports/attendance-report-modal";
import { GradeReportModal } from "@/components/reports/grade-report-modal";
import { KasReportModal } from "@/components/reports/kas-report-modal";
import { ScheduleReportModal } from "@/components/reports/schedule-report-modal";
import { StudentDirectoryModal } from "@/components/reports/student-directory-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendanceEntryRow, GradeEntryRow } from "@/lib/actions/admin-akademik";
import type { PiketDay, ScheduleEntry } from "@/lib/actions/jadwal";
import type { KasSettings, Profile } from "@/lib/db/schema";
import { exportToExcel } from "@/lib/utils/export-excel";

interface ReportHubDashboardProps {
  subjects: { id: string; name: string }[];
  students: Profile[];
  schedule: ScheduleEntry[];
  piket: PiketDay[];
  kasSettings: KasSettings | null;
  initialAttendanceSheet: AttendanceEntryRow[];
  waliKelas: Profile | null;
}

export function ReportHubDashboard({
  subjects,
  students,
  schedule,
  piket,
  kasSettings,
  initialAttendanceSheet,
  waliKelas,
}: ReportHubDashboardProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? "");
  const [semester, setSemester] = useState("Ganjil 2026/2027");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const currentSubjectName = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId)?.name ?? "Mata Pelajaran",
    [subjects, selectedSubjectId],
  );

  const sampleGradeSheet: GradeEntryRow[] = useMemo(() => {
    return students.map((s) => ({
      studentId: s.id,
      fullName: s.fullName,
      absenNumber: s.absenNumber,
      existingScore: 85,
    }));
  }, [students]);

  // Handler ekspor langsung ke Excel untuk tiap kategori dokumen
  const exportPresensiExcel = useCallback(() => {
    exportToExcel({
      fileName: `Rekap_Presensi_XII_RPL3_${selectedDate}`,
      title: "Rekapitulasi Presensi Siswa Kelas XII RPL 3",
      subtitle: `Tanggal: ${selectedDate}`,
      columns: ["No", "Nomor Absen", "Nama Lengkap Siswa", "Status Kehadiran", "Keterangan"],
      data: initialAttendanceSheet.map((s, idx) => [
        idx + 1,
        s.absenNumber ?? "-",
        s.fullName,
        (s.existingStatus ?? "hadir").toUpperCase(),
        "KBM Reguler",
      ]),
    });
    toast.success("Lembar Presensi berhasil diekspor ke Excel (.xls).");
  }, [selectedDate, initialAttendanceSheet]);

  const exportNilaiExcel = useCallback(() => {
    exportToExcel({
      fileName: `Leger_Nilai_${currentSubjectName.replace(/\s+/g, "_")}_${semester.replace(/[/\s]/g, "_")}`,
      title: `Leger Nilai Mata Pelajaran: ${currentSubjectName}`,
      subtitle: `Semester: ${semester} - KKM: 75`,
      columns: [
        "No",
        "Nomor Absen",
        "Nama Lengkap Siswa",
        "Nilai Tugas",
        "Nilai Akhir",
        "Predikat",
        "Status KKM",
      ],
      data: sampleGradeSheet.map((s, idx) => [
        idx + 1,
        s.absenNumber ?? "-",
        s.fullName,
        s.existingScore ?? 85,
        s.existingScore ?? 85,
        "B",
        "TUNTAS",
      ]),
    });
    toast.success("Leger Nilai berhasil diekspor ke Excel (.xls).");
  }, [currentSubjectName, semester, sampleGradeSheet]);

  const exportJadwalExcel = useCallback(() => {
    exportToExcel({
      fileName: "Jadwal_Pelajaran_XII_RPL3_2026",
      title: "Jadwal Pelajaran Mingguan Kelas XII RPL 3",
      subtitle: "Tahun Pelajaran 2026/2027",
      columns: [
        "Hari",
        "Jam Ke",
        "Waktu Mulai",
        "Waktu Selesai",
        "Mata Pelajaran",
        "Guru Pengampu",
        "Ruang",
      ],
      data: schedule.map((item) => [
        item.dayOfWeek.toUpperCase(),
        item.periodNumber,
        item.startTime,
        item.endTime,
        item.subjectName ?? "-",
        item.teacherName ?? "-",
        item.room ?? "Lab RPL",
      ]),
    });
    toast.success("Jadwal Pelajaran berhasil diekspor ke Excel (.xls).");
  }, [schedule]);

  const exportKasExcel = useCallback(() => {
    exportToExcel({
      fileName: "Laporan_Kas_Digital_XII_RPL3",
      title: "Laporan Informasi & Pengelolaan Kas Kelas XII RPL 3",
      subtitle: "Tahun Pelajaran 2026/2027",
      columns: ["Parameter", "Rincian Ketentuan Resmi"],
      data: [
        ["Nominal Iuran Wajib", kasSettings?.nominalInfo ?? "Rp 5.000 / minggu"],
        ["Saluran Pembayaran", "E-Wallet DANA / QRIS"],
        ["Nomor Akun DANA", kasSettings?.danaNumber ?? "-"],
        ["Atas Nama Akun", kasSettings?.danaAccountName ?? "Bendahara XII RPL 3"],
        [
          "Petunjuk Transfer",
          kasSettings?.instructions ?? "Konfirmasi bukti transfer ke Bendahara.",
        ],
      ],
    });
    toast.success("Laporan Kas berhasil diekspor ke Excel (.xls).");
  }, [kasSettings]);

  const exportDirektoriExcel = useCallback(() => {
    exportToExcel({
      fileName: "Direktori_Siswa_XII_RPL3",
      title: "Daftar Absen & Direktori Siswa Kelas XII RPL 3",
      subtitle: `Total: ${students.length} Siswa Terdaftar`,
      columns: [
        "No",
        "Nomor Absen",
        "NIS",
        "Nama Lengkap Siswa",
        "Jenis Kelamin",
        "Jabatan / Peran",
      ],
      data: students.map((s, idx) => [
        idx + 1,
        s.absenNumber ?? "-",
        s.nis ?? "-",
        s.fullName,
        s.gender ?? "-",
        s.jabatan ?? (s.role === "pengurus" ? "Pengurus Kelas" : "Siswa"),
      ]),
    });
    toast.success("Direktori Siswa berhasil diekspor ke Excel (.xls).");
  }, [students]);

  const reportItems = [
    {
      id: "presensi",
      title: "Rekapitulasi Presensi Siswa",
      category: "Akademik & Kehadiran",
      description:
        "Lembar daftar hadir 34 siswa harian lengkap dengan nomor absen, status hadir/sakit/izin/alpa, dan persentase kehadiran.",
      icon: CheckCircle2,
      badge: "Harian & Kumulatif",
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      onExportExcel: exportPresensiExcel,
      modal: (
        <AttendanceReportModal
          date={selectedDate}
          sheet={initialAttendanceSheet}
          statuses={{}}
          waliKelasName={waliKelas?.fullName}
          triggerButton={
            <Button className="flex-1 gap-2 cursor-pointer font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>
          }
        />
      ),
    },
    {
      id: "nilai",
      title: "Leger Nilai Mata Pelajaran",
      category: "Penilaian & Hasil Belajar",
      description:
        "Rekapitulasi nilai Tugas, UTS, UAS, Praktik, Nilai Akhir, KKM (75), predikat kelulusan, dan statistik kelas per mapel.",
      icon: GraduationCap,
      badge: "Leger Resmi",
      color: "text-purple-600 bg-purple-500/10 border-purple-500/20",
      onExportExcel: exportNilaiExcel,
      modal: (
        <GradeReportModal
          subjectName={currentSubjectName}
          semester={semester}
          activeAssessmentType="tugas"
          sheet={sampleGradeSheet}
          scores={{}}
          waliKelasName={waliKelas?.fullName}
          triggerButton={
            <Button className="flex-1 gap-2 cursor-pointer font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>
          }
        />
      ),
    },
    {
      id: "jadwal",
      title: "Jadwal Pelajaran & Piket Kebersihan",
      category: "KBM & Ketertiban",
      description:
        "Tabel matriks jadwal pelajaran mingguan (Senin-Jumat) beserta alokasi petugas piket kebersihan harian kelas XII RPL 3.",
      icon: CalendarDays,
      badge: "Format Landscape",
      color: "text-sky-600 bg-sky-500/10 border-sky-500/20",
      onExportExcel: exportJadwalExcel,
      modal: (
        <ScheduleReportModal
          schedule={schedule}
          piket={piket}
          waliKelasName={waliKelas?.fullName}
          triggerButton={
            <Button className="flex-1 gap-2 cursor-pointer font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>
          }
        />
      ),
    },
    {
      id: "kas",
      title: "Laporan Kas Digital & Iuran Kelas",
      category: "Keuangan Kelas",
      description:
        "Dokumen transparansi tata kelola kas kelas, nomor rekening resmi DANA / QRIS, petunjuk iuran, dan alokasi anggaran.",
      icon: Wallet,
      badge: "Transparansi Dana",
      color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      onExportExcel: exportKasExcel,
      modal: (
        <KasReportModal
          settings={kasSettings}
          waliKelasName={waliKelas?.fullName}
          triggerButton={
            <Button className="flex-1 gap-2 cursor-pointer font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>
          }
        />
      ),
    },
    {
      id: "direktori",
      title: "Daftar Absen & Direktori Siswa",
      category: "Kesiswaan",
      description:
        "Daftar resmi seluruh 34 siswa kelas XII RPL 3 dengan nomor urut absen, NIS, jenis kelamin (L/P), dan susunan pengurus.",
      icon: Users,
      badge: "34 Siswa",
      color: "text-rose-600 bg-rose-500/10 border-rose-500/20",
      onExportExcel: exportDirektoriExcel,
      modal: (
        <StudentDirectoryModal
          students={students}
          waliKelasName={waliKelas?.fullName}
          triggerButton={
            <Button className="flex-1 gap-2 cursor-pointer font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              <Printer className="size-4" />
              <span>Cetak / PDF</span>
            </Button>
          }
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Parameter Konfigurasi Cepat */}
      <Card className="border-border bg-surface/50 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent-text" />
            <CardTitle className="text-base font-semibold">Parameter Dokumen Cetak</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Sesuaikan opsi di bawah sebelum mencetak laporan agar dokumen terisi data yang tepat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="hub-date" className="text-xs text-muted">
                Tanggal Laporan Presensi
              </Label>
              <Input
                id="hub-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hub-subject" className="text-xs text-muted">
                Mata Pelajaran (Leger Nilai)
              </Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger id="hub-subject" className="bg-background">
                  <SelectValue placeholder="Pilih Mapel" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hub-semester" className="text-xs text-muted">
                Semester & Tahun Pelajaran
              </Label>
              <Input
                id="hub-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Ganjil 2026/2027"
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Katalog Dokumen Laporan Siap Cetak */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className="flex flex-col justify-between border-border bg-surface transition-all hover:border-accent/40 hover:shadow-md"
            >
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg border ${item.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] tracking-wide">
                    {item.badge}
                  </Badge>
                </div>

                <div>
                  <p className="font-mono text-[11px] text-muted uppercase tracking-wider">
                    {item.category}
                  </p>
                  <CardTitle className="mt-1 font-display text-lg font-semibold tracking-tight">
                    {item.title}
                  </CardTitle>
                </div>

                <CardDescription className="text-xs leading-relaxed text-muted line-clamp-3">
                  {item.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="border-t border-border pt-4 flex items-center gap-2">
                  {item.modal}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={item.onExportExcel}
                    className="gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 font-medium cursor-pointer"
                    title="Unduh format Microsoft Excel"
                  >
                    <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Excel</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
