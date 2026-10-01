"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { upsertClassSchedule } from "@/lib/actions/admin-jadwal";
import type { ScheduleEntry } from "@/lib/actions/jadwal";
import type { DayOfWeek } from "@/lib/db/schema";

const DAY_LABELS: Record<DayOfWeek, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};
const DAYS: DayOfWeek[] = ["senin", "selasa", "rabu", "kamis", "jumat"];

interface EditableRow {
  key: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string | null;
  teacherName: string;
  room: string;
}

let rowCounter = 0;
function newRowKey() {
  rowCounter += 1;
  return `new-${rowCounter}`;
}

export function ScheduleManager({
  entries,
  subjects,
}: {
  entries: ScheduleEntry[];
  subjects: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<EditableRow[]>(() =>
    entries.map((entry) => ({
      key: entry.id,
      dayOfWeek: entry.dayOfWeek,
      periodNumber: entry.periodNumber,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subjectId: entry.subjectId,
      teacherName: entry.teacherName ?? "",
      room: entry.room ?? "",
    })),
  );
  const [isPending, startTransition] = useTransition();

  function updateRow(key: string, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: newRowKey(),
        dayOfWeek: "senin",
        periodNumber: prev.length + 1,
        startTime: "07:00",
        endTime: "07:45",
        subjectId: null,
        teacherName: "",
        room: "",
      },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertClassSchedule(
        rows.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          periodNumber: row.periodNumber,
          startTime: row.startTime,
          endTime: row.endTime,
          subjectId: row.subjectId,
          teacherName: row.teacherName || undefined,
          room: row.room || undefined,
        })),
      );
      if (result.error) toast.error(result.error);
      else toast.success("Jadwal pelajaran tersimpan.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Hari</TableHead>
            <TableHead scope="col">Jam ke-</TableHead>
            <TableHead scope="col">Mulai</TableHead>
            <TableHead scope="col">Selesai</TableHead>
            <TableHead scope="col">Mata Pelajaran</TableHead>
            <TableHead scope="col">Guru</TableHead>
            <TableHead scope="col">Ruang</TableHead>
            <TableHead scope="col">
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>
                <Select
                  value={row.dayOfWeek}
                  onValueChange={(value) => updateRow(row.key, { dayOfWeek: value as DayOfWeek })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {DAY_LABELS[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={row.periodNumber}
                  onChange={(event) =>
                    updateRow(row.key, { periodNumber: Number(event.target.value) })
                  }
                  className="w-16"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="time"
                  value={row.startTime}
                  onChange={(event) => updateRow(row.key, { startTime: event.target.value })}
                  className="w-28"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="time"
                  value={row.endTime}
                  onChange={(event) => updateRow(row.key, { endTime: event.target.value })}
                  className="w-28"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={row.subjectId ?? "none"}
                  onValueChange={(value) =>
                    updateRow(row.key, { subjectId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Kosong —</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={row.teacherName}
                  onChange={(event) => updateRow(row.key, { teacherName: event.target.value })}
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.room}
                  onChange={(event) => updateRow(row.key, { room: event.target.value })}
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.key)}
                  aria-label="Hapus baris jadwal"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={addRow}>
          <Plus className="size-4" /> Tambah Baris
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Semua"}
        </Button>
      </div>
    </div>
  );
}
