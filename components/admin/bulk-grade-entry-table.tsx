"use client";

import { CheckCircle2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { GradeReportModal } from "@/components/reports/grade-report-modal";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  praktik: "Praktik",
};
const ASSESSMENT_TYPES: AssessmentType[] = ["tugas", "uts", "uas", "praktik"];

interface SaveNotice {
  time: string;
  count: number;
  average: number;
}

export function BulkGradeEntryTable({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("tugas");
  const [semester, setSemester] = useState("Ganjil 2026/2027");
  const [sheet, setSheet] = useState<GradeEntryRow[] | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const [isLoading, startLoadTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const currentSubjectName = useMemo(
    () => subjects.find((s) => s.id === subjectId)?.name ?? "Mata Pelajaran",
    [subjects, subjectId],
  );

  const loadData = useCallback((subjId: string, aType: AssessmentType, sem: string) => {
    if (!subjId) return;
    startLoadTransition(async () => {
      try {
        const rows = await fetchGradeEntrySheet(subjId, aType, sem);
        setSheet(rows);
        setScores(
          Object.fromEntries(
            rows.map((row) => [
              row.studentId,
              row.existingScore !== null ? String(row.existingScore) : "",
            ]),
          ),
        );
      } catch {
        toast.error("Gagal memuat lembar nilai.");
      }
    });
  }, []);

  // Auto-load saat subjek atau opsi berubah
  useEffect(() => {
    if (subjectId) {
      loadData(subjectId, assessmentType, semester);
      setSaveNotice(null);
    }
  }, [subjectId, assessmentType, semester, loadData]);

  // Statistik nilai real-time
  const stats = useMemo(() => {
    if (!sheet) return { filled: 0, total: 0, avg: 0, max: 0, min: 0 };
    const validScores: number[] = [];
    for (const row of sheet) {
      const val = (scores[row.studentId] ?? "").trim();
      if (val !== "" && !Number.isNaN(Number(val))) {
        validScores.push(Number(val));
      }
    }
    const filled = validScores.length;
    const total = sheet.length;
    if (filled === 0) return { filled, total, avg: 0, max: 0, min: 0 };
    const sum = validScores.reduce((acc, s) => acc + s, 0);
    const avg = Math.round((sum / filled) * 10) / 10;
    const max = Math.max(...validScores);
    const min = Math.min(...validScores);
    return { filled, total, avg, max, min };
  }, [sheet, scores]);

  // Filter siswa live
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
      if (result.error) {
        toast.error(result.error);
      } else {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(now);

        setSaveNotice({
          time: timeStr,
          count: rows.length,
          average: stats.avg,
        });

        toast.success(`${rows.length} nilai berhasil disimpan (Rata-rata: ${stats.avg}).`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Parameter Form */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted">Mata Pelajaran</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="bg-background">
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
            <Label className="text-xs text-muted">Jenis Penilaian</Label>
            <Select
              value={assessmentType}
              onValueChange={(value) => setAssessmentType(value as AssessmentType)}
            >
              <SelectTrigger className="bg-background">
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
            <Label htmlFor="grade-semester" className="text-xs text-muted">
              Semester
            </Label>
            <Input
              id="grade-semester"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              placeholder="Ganjil 2026/2027"
              className="bg-background"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadData(subjectId, assessmentType, semester)}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
              Segarkan
            </Button>
            {sheet ? (
              <GradeReportModal
                subjectName={currentSubjectName}
                semester={semester}
                activeAssessmentType={assessmentType}
                sheet={sheet}
                scores={scores}
              />
            ) : null}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !sheet || isLoading}
              className="bg-accent font-medium text-white shadow-xs hover:bg-accent/90"
            >
              {isSaving ? "Menyimpan..." : "Simpan Semua"}
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Grade Analytics */}
      {sheet ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface/70 p-3 text-center">
            <p className="font-mono text-xs text-muted">Nilai Terisi</p>
            <p className="mt-0.5 font-display text-2xl font-bold">
              {stats.filled} <span className="text-muted text-sm font-normal">/ {stats.total}</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/70 p-3 text-center">
            <p className="font-mono text-xs text-muted">Rata-rata Kelas</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-accent-text">
              {stats.avg > 0 ? stats.avg : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <p className="font-mono text-xs text-emerald-700 dark:text-emerald-300">
              Nilai Tertinggi
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.max > 0 ? stats.max : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
            <p className="font-mono text-xs text-amber-700 dark:text-amber-300">Nilai Terendah</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.min > 0 ? stats.min : "-"}
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
              Data nilai {saveNotice.count} siswa berhasil disimpan pada {saveNotice.time} WIB.
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              Mata pelajaran aktif: {subjects.find((s) => s.id === subjectId)?.name} · Rata-rata
              kelas: {saveNotice.average}.
            </p>
          </div>
        </div>
      ) : null}

      {/* Table Section */}
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
                    <TableHead scope="col" className="w-40 font-semibold">
                      Nilai (0 - 100)
                    </TableHead>
                    <TableHead scope="col" className="w-32 font-semibold">
                      Keterangan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const val = Number(scores[row.studentId]);
                    const hasValue = (scores[row.studentId] ?? "").trim() !== "";
                    const isTuntas = hasValue && val >= 75;

                    return (
                      <TableRow key={row.studentId} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-muted">
                          {row.absenNumber !== null
                            ? String(row.absenNumber).padStart(2, "0")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {row.fullName}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={scores[row.studentId] ?? ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              setScores((prev) => ({
                                ...prev,
                                [row.studentId]: value,
                              }));
                            }}
                            className={cn(
                              "w-28 text-center font-mono font-medium",
                              hasValue && isTuntas && "border-emerald-500/50 bg-emerald-500/5",
                              hasValue &&
                                !isTuntas &&
                                "border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                            )}
                            placeholder="0-100"
                          />
                        </TableCell>
                        <TableCell>
                          {hasValue ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                isTuntas
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                              )}
                            >
                              {isTuntas ? "Tuntas" : "Remedial"}
                            </Badge>
                          ) : (
                            <span className="text-muted text-xs">Belum diisi</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Bottom Action */}
          <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-border border-t pt-4 gap-4">
            <p className="text-muted text-xs">
              Nilai di atas 75 dianggap tuntas (KKM). Kolom kosong tidak akan mengubah nilai yang
              sudah tersimpan sebelumnya.
            </p>
            <div className="flex items-center gap-2">
              <GradeReportModal
                subjectName={currentSubjectName}
                semester={semester}
                activeAssessmentType={assessmentType}
                sheet={sheet}
                scores={scores}
              />
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !sheet || isLoading}
                className="bg-accent font-medium text-white shadow-xs hover:bg-accent/90"
              >
                {isSaving ? "Menyimpan..." : "Simpan Semua Nilai"}
              </Button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border border-dashed p-12 text-muted text-sm">
          <RefreshCw className="size-5 animate-spin" />
          Memuat lembar nilai...
        </div>
      ) : null}
    </div>
  );
}
