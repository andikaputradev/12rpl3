"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
};
const STATUSES: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BulkAttendanceEntryTable() {
  const [date, setDate] = useState(todayIso());
  const [sheet, setSheet] = useState<AttendanceEntryRow[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, startLoadTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function handleLoad() {
    startLoadTransition(async () => {
      const rows = await fetchAttendanceEntrySheet(date);
      setSheet(rows);
      // Default "Hadir" untuk baris yang belum direkam — staf tinggal
      // mengubah baris yang tidak hadir (Bagian 7 brief).
      setStatuses(
        Object.fromEntries(rows.map((row) => [row.studentId, row.existingStatus ?? "hadir"])),
      );
    });
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
      if (result.error) toast.error(result.error);
      else toast.success(`Absensi ${sheet.length} siswa tersimpan.`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="attendance-date">Tanggal</Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-44"
          />
        </div>
        <Button type="button" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? "Memuat..." : "Muat Lembar"}
        </Button>
      </div>

      {sheet ? (
        sheet.length === 0 ? (
          <p className="text-muted text-sm">Belum ada data siswa.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-14">
                    No.
                  </TableHead>
                  <TableHead scope="col">Nama Siswa</TableHead>
                  <TableHead scope="col">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheet.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="text-muted">{row.absenNumber ?? "—"}</TableCell>
                    <TableCell className="font-medium">{row.fullName}</TableCell>
                    <TableCell>
                      <ToggleGroup
                        type="single"
                        size="sm"
                        value={statuses[row.studentId] ?? "hadir"}
                        onValueChange={(value) => {
                          if (value) {
                            setStatuses((prev) => ({
                              ...prev,
                              [row.studentId]: value as AttendanceStatus,
                            }));
                          }
                        }}
                      >
                        {STATUSES.map((status) => (
                          <ToggleGroupItem
                            key={status}
                            value={status}
                            aria-label={STATUS_LABELS[status]}
                          >
                            {STATUS_LABELS[status]}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="self-start">
              {isSaving ? "Menyimpan..." : "Simpan Semua"}
            </Button>
          </>
        )
      ) : null}
    </div>
  );
}
