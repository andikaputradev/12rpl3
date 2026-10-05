"use client";

import { CheckCircle2, RefreshCw, RotateCcw, Search, UserCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AttendanceReportModal } from "@/components/reports/attendance-report-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AttendanceEntryRow } from "@/lib/actions/admin-akademik";
import { fetchAttendanceEntrySheet } from "@/lib/actions/admin-akademik-client";
import { bulkUpsertAttendance } from "@/lib/actions/admin-akademik-mutations";
import type { AttendanceStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};

const STATUS_ACTIVE_STYLES: Record<AttendanceStatus, string> = {
  hadir:
    "data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:hover:bg-emerald-700",
  sakit:
    "data-[state=on]:bg-amber-600 data-[state=on]:text-white data-[state=on]:hover:bg-amber-700",
  izin: "data-[state=on]:bg-sky-600 data-[state=on]:text-white data-[state=on]:hover:bg-sky-700",
  alpa: "data-[state=on]:bg-rose-600 data-[state=on]:text-white data-[state=on]:hover:bg-rose-700",
};

const STATUSES: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

interface SaveNotice {
  time: string;
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
}

export function BulkAttendanceEntryTable() {
  const [date, setDate] = useState(todayIso());
  const [sheet, setSheet] = useState<AttendanceEntryRow[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const [isLoading, startLoadTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const loadData = useCallback((targetDate: string) => {
    startLoadTransition(async () => {
      try {
        const rows = await fetchAttendanceEntrySheet(targetDate);
        setSheet(rows);
        setStatuses(
          Object.fromEntries(rows.map((row) => [row.studentId, row.existingStatus ?? "hadir"])),
        );
      } catch {
        toast.error("Gagal memuat data absensi.");
      }
    });
  }, []);

  // Otomatis muat data saat pertama buka halaman atau tanggal berubah
  useEffect(() => {
    loadData(date);
    setSaveNotice(null);
  }, [date, loadData]);

  // Statistik headcount langsung terupdate seketika
  const counts = useMemo(() => {
    if (!sheet) return { total: 0, hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    for (const row of sheet) {
      const st = statuses[row.studentId] ?? "hadir";
      if (st === "hadir") hadir++;
      else if (st === "sakit") sakit++;
      else if (st === "izin") izin++;
      else if (st === "alpa") alpa++;
    }
    return { total: sheet.length, hadir, sakit, izin, alpa };
  }, [sheet, statuses]);

  // Filter daftar siswa secara real-time
  const filteredRows = useMemo(() => {
    if (!sheet) return [];
    if (!searchQuery.trim()) return sheet;
    const q = searchQuery.toLowerCase().trim();
    return sheet.filter((row) => {
      const matchName = row.fullName.toLowerCase().includes(q);
      const matchAbsen = row.absenNumber !== null && String(row.absenNumber).includes(q);
      return matchName || matchAbsen;
    });
  }, [sheet, searchQuery]);

  function handleMarkAllHadir() {
    if (!sheet) return;
    setStatuses(Object.fromEntries(sheet.map((row) => [row.studentId, "hadir"])));
    toast.info("Seluruh siswa telah ditandai Hadir.");
  }

  function handleResetToSaved() {
    if (!sheet) return;
    setStatuses(
      Object.fromEntries(sheet.map((row) => [row.studentId, row.existingStatus ?? "hadir"])),
    );
    toast.info("Status dikembalikan ke data tersimpan sebelumnya.");
  }

  function handleSave() {
    if (!sheet || sheet.length === 0) return;
    startSaveTransition(async () => {
      const result = await bulkUpsertAttendance({
        date,
        rows: sheet.map((row) => ({
          studentId: row.studentId,
          status: statuses[row.studentId] ?? "hadir",
        })),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(now);

        const currentCounts = counts;
        setSaveNotice({
          time: timeStr,
          total: currentCounts.total,
          hadir: currentCounts.hadir,
          sakit: currentCounts.sakit,
          izin: currentCounts.izin,
          alpa: currentCounts.alpa,
        });

        toast.success(
          `Absensi ${sheet.length} siswa tersimpan: ${currentCounts.hadir} Hadir, ${currentCounts.sakit} Sakit, ${currentCounts.izin} Izin, ${currentCounts.alpa} Alpa.`,
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-date" className="font-medium text-xs text-muted">
              Pilih Tanggal Absensi
            </Label>
            <Input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-44 bg-background font-medium"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => loadData(date)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            {isLoading ? "Memuat..." : "Segarkan"}
          </Button>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllHadir}
            disabled={!sheet || isLoading}
            className="gap-1.5 font-medium text-xs border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Tandai Semua Hadir
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToSaved}
            disabled={!sheet || isLoading}
            className="gap-1.5 text-xs text-muted"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>

          {sheet ? <AttendanceReportModal date={date} sheet={sheet} statuses={statuses} /> : null}

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !sheet || isLoading}
            className="gap-2 bg-accent font-medium text-white shadow-xs hover:bg-accent/90"
          >
            {isSaving ? "Menyimpan..." : "Simpan Semua"}
          </Button>
        </div>
      </div>

      {/* Live Headcount Summary Bar */}
      {sheet ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-lg border border-border bg-surface/70 p-3 text-center">
            <p className="font-mono text-xs text-muted">Total Siswa</p>
            <p className="mt-0.5 font-display text-2xl font-bold">{counts.total}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <p className="font-mono text-xs text-emerald-700 dark:text-emerald-300">Hadir</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {counts.hadir}
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
            <p className="font-mono text-xs text-amber-700 dark:text-amber-300">Sakit</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-amber-700 dark:text-amber-300">
              {counts.sakit}
            </p>
          </div>
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3 text-center">
            <p className="font-mono text-xs text-sky-700 dark:text-sky-300">Izin</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-sky-700 dark:text-sky-300">
              {counts.izin}
            </p>
          </div>
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-center">
            <p className="font-mono text-xs text-rose-700 dark:text-rose-300">Alpa</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-rose-700 dark:text-rose-300">
              {counts.alpa}
            </p>
          </div>
        </div>
      ) : null}

      {/* Prominent Success Notification Banner */}
      {saveNotice ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 text-sm dark:text-emerald-200">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <p className="font-medium">
              Data absensi tanggal {date} berhasil disimpan pada {saveNotice.time} WIB.
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              Rincian: {saveNotice.hadir} Hadir · {saveNotice.sakit} Sakit · {saveNotice.izin} Izin
              · {saveNotice.alpa} Alpa (Total: {saveNotice.total} siswa).
            </p>
          </div>
        </div>
      ) : null}

      {/* Search and Table Area */}
      {sheet ? (
        <div className="flex flex-col gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-3 size-4 text-muted" />
            <Input
              placeholder="Cari nama atau no. absen siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {filteredRows.length === 0 ? (
            <p className="rounded-lg border border-border border-dashed p-8 text-center text-muted text-sm">
              Tidak ada siswa yang cocok dengan pencarian "{searchQuery}".
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead scope="col" className="w-16 font-semibold">
                      Absen
                    </TableHead>
                    <TableHead scope="col" className="font-semibold">
                      Nama Siswa
                    </TableHead>
                    <TableHead scope="col" className="w-80 font-semibold">
                      Status Kehadiran
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const currentStatus = statuses[row.studentId] ?? "hadir";
                    return (
                      <TableRow key={row.studentId} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-muted">
                          {row.absenNumber !== null
                            ? String(row.absenNumber).padStart(2, "0")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">{row.fullName}</span>
                        </TableCell>
                        <TableCell>
                          <ToggleGroup
                            type="single"
                            size="sm"
                            value={currentStatus}
                            onValueChange={(value) => {
                              if (value) {
                                setStatuses((prev) => ({
                                  ...prev,
                                  [row.studentId]: value as AttendanceStatus,
                                }));
                              }
                            }}
                            className="justify-start gap-1"
                          >
                            {STATUSES.map((status) => (
                              <ToggleGroupItem
                                key={status}
                                value={status}
                                aria-label={STATUS_LABELS[status]}
                                className={cn(
                                  "h-8 rounded-md px-3 font-medium text-xs transition-all",
                                  STATUS_ACTIVE_STYLES[status],
                                )}
                              >
                                {STATUS_LABELS[status]}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-border border-t pt-4 gap-4">
            <p className="text-muted text-xs">
              Pastikan seluruh status kehadiran telah ditinjau sebelum menekan tombol simpan atau
              mencetak laporan.
            </p>
            <div className="flex items-center gap-2">
              <AttendanceReportModal date={date} sheet={sheet} statuses={statuses} />
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !sheet || isLoading}
                className="gap-2 bg-accent font-medium text-white shadow-xs hover:bg-accent/90"
              >
                {isSaving ? "Menyimpan..." : "Simpan Semua Absensi"}
              </Button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border border-dashed p-12 text-muted text-sm">
          <RefreshCw className="size-5 animate-spin" />
          Memuat lembar absensi...
        </div>
      ) : null}
    </div>
  );
}
