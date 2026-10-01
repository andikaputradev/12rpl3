"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { GradeEntryRow } from "@/lib/actions/admin-akademik";
import { fetchGradeEntrySheet } from "@/lib/actions/admin-akademik-client";
import { bulkUpsertGrades } from "@/lib/actions/admin-akademik-mutations";
import type { AssessmentType } from "@/lib/db/schema";

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  praktik: "Praktik",
};
const ASSESSMENT_TYPES: AssessmentType[] = ["tugas", "uts", "uas", "praktik"];

export function BulkGradeEntryTable({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("tugas");
  const [semester, setSemester] = useState("Ganjil 2026/2027");
  const [sheet, setSheet] = useState<GradeEntryRow[] | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [isLoading, startLoadTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function handleLoad() {
    if (!subjectId) {
      toast.error("Pilih mata pelajaran terlebih dahulu.");
      return;
    }
    startLoadTransition(async () => {
      const rows = await fetchGradeEntrySheet(subjectId, assessmentType, semester);
      setSheet(rows);
      setScores(
        Object.fromEntries(
          rows.map((row) => [
            row.studentId,
            row.existingScore !== null ? String(row.existingScore) : "",
          ]),
        ),
      );
    });
  }

  function handleSave() {
    if (!sheet) return;
    const rows = sheet
      .filter((row) => (scores[row.studentId] ?? "").trim() !== "")
      .map((row) => ({ studentId: row.studentId, score: Number(scores[row.studentId]) }));

    if (rows.length === 0) {
      toast.error("Tidak ada nilai untuk disimpan.");
      return;
    }

    startSaveTransition(async () => {
      const result = await bulkUpsertGrades({ subjectId, assessmentType, semester, rows });
      if (result.error) toast.error(result.error);
      else toast.success(`${rows.length} nilai tersimpan.`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label>Mata Pelajaran</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih mata pelajaran" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Jenis Penilaian</Label>
          <Select
            value={assessmentType}
            onValueChange={(value) => setAssessmentType(value as AssessmentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSESSMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ASSESSMENT_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grade-semester">Semester</Label>
          <Input
            id="grade-semester"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            placeholder="Ganjil 2026/2027"
          />
        </div>
        <Button type="button" onClick={handleLoad} disabled={isLoading} className="self-end">
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
                  <TableHead scope="col" className="w-32">
                    Nilai (0–100)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheet.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="text-muted">{row.absenNumber ?? "—"}</TableCell>
                    <TableCell className="font-medium">{row.fullName}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={scores[row.studentId] ?? ""}
                        onChange={(event) =>
                          setScores((prev) => ({ ...prev, [row.studentId]: event.target.value }))
                        }
                        className="w-24"
                      />
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
