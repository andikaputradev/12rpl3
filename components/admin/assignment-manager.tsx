"use client";

import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AssignmentWithSubmissions } from "@/lib/actions/admin-akademik";
import {
  type ActionState,
  createAssignment,
  deleteAssignment,
  toggleSubmissionReviewed,
} from "@/lib/actions/admin-akademik-mutations";

const initialCreateState: ActionState = {};

interface AssignmentManagerProps {
  assignments: AssignmentWithSubmissions[];
  subjects: { id: string; name: string }[];
}

export function AssignmentManager({ assignments, subjects }: AssignmentManagerProps) {
  const [createState, createAction, isCreating] = useActionState(
    createAssignment,
    initialCreateState,
  );
  const [activeTab, setActiveTab] = useState<string>("list");
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [inspectingAssignment, setInspectingAssignment] =
    useState<AssignmentWithSubmissions | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentWithSubmissions | null>(
    null,
  );
  const [modalTab, setModalTab] = useState<"submitted" | "pending">("submitted");
  const [isPending, startTransition] = useTransition();

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (createState.success && createState.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = createState.timestamp;
      toast.success("Tugas berhasil ditambahkan ke bank tugas.");
      formRef.current?.reset();
      setActiveTab("list");
    }
    if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState]);

  // Update inspecting assignment data when assignments prop changes
  useEffect(() => {
    if (inspectingAssignment) {
      const refreshed = assignments.find((a) => a.id === inspectingAssignment.id);
      if (refreshed) {
        setInspectingAssignment(refreshed);
      }
    }
  }, [assignments, inspectingAssignment]);

  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
  );

  const filteredAssignments = sortedAssignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (a.subjectName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesSubject =
      selectedSubject === "all" ||
      (selectedSubject === "none" && !a.subjectId) ||
      a.subjectId === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  function handleDeleteAssignment() {
    if (!deletingAssignment) return;
    startTransition(async () => {
      const res = await deleteAssignment(deletingAssignment.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Tugas "${deletingAssignment.title}" berhasil dihapus.`);
      if (inspectingAssignment?.id === deletingAssignment.id) {
        setInspectingAssignment(null);
      }
      setDeletingAssignment(null);
    });
  }

  function handleToggleReviewed(submissionId: string, currentReviewed: boolean) {
    startTransition(async () => {
      const res = await toggleSubmissionReviewed(submissionId, !currentReviewed);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        !currentReviewed ? "Kiriman ditandai sudah ditinjau." : "Tanda tinjauan dicabut.",
      );
    });
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              <Eye className="size-4" />
              <span>Daftar & Kiriman Tugas ({assignments.length})</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="size-4" />
              <span>Buat Tugas Baru</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: LIST & VIEW SUBMISSIONS */}
        <TabsContent value="list" className="mt-6 space-y-6">
          {/* Filter & Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
              <Input
                placeholder="Cari judul tugas, mapel, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted shrink-0" />
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48 text-sm">
                  <SelectValue placeholder="Semua Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                  <SelectItem value="none">Umum (tanpa mapel)</SelectItem>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <Card className="border-dashed bg-surface/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="size-10 text-muted/60 mb-3" />
                <p className="font-display text-base font-semibold text-foreground">
                  Belum ada tugas ditemukan
                </p>
                <p className="text-xs text-muted max-w-sm mt-1">
                  {search || selectedSubject !== "all"
                    ? "Coba ubah kata kunci pencarian atau filter mata pelajaran."
                    : "Tambahkan tugas pertama Anda melalui tab 'Buat Tugas Baru' di atas."}
                </p>
                {!(search || selectedSubject !== "all") && (
                  <Button size="sm" className="mt-4 gap-1.5" onClick={() => setActiveTab("create")}>
                    <Plus className="size-4" />
                    <span>Buat Tugas</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => {
                const dueDate = new Date(assignment.dueDate);
                const isOverdue = dueDate.getTime() < now.getTime();
                const pct =
                  assignment.totalStudents > 0
                    ? Math.round((assignment.totalSubmissions / assignment.totalStudents) * 100)
                    : 0;

                return (
                  <Card
                    key={assignment.id}
                    className="flex flex-col justify-between border-border bg-surface transition-all hover:border-accent/40 hover:shadow-xs"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium border-accent/40 bg-accent/10 text-accent-text"
                        >
                          {assignment.subjectName ?? "Umum"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isOverdue
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {isOverdue ? "Lewat Tenggat" : "Sedang Aktif"}
                        </Badge>
                      </div>

                      <CardTitle className="mt-2 text-base font-semibold leading-snug text-foreground">
                        {assignment.title}
                      </CardTitle>

                      {assignment.description ? (
                        <p className="line-clamp-2 text-xs text-muted leading-relaxed">
                          {assignment.description}
                        </p>
                      ) : null}
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4 pt-0">
                      {/* Due date info */}
                      <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
                        <Clock className="size-3.5 shrink-0 text-accent-text" />
                        <span>
                          {new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(dueDate)}
                        </span>
                      </div>

                      {/* Submissions Progress */}
                      <div className="rounded-lg border border-border/80 bg-background/50 p-2.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <Users className="size-3.5 text-accent-text" />
                            <span>Pengumpulan</span>
                          </span>
                          <span className="font-mono text-accent-text">
                            {assignment.totalSubmissions} / {assignment.totalStudents} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 flex-1 gap-1.5 text-xs"
                          onClick={() => setInspectingAssignment(assignment)}
                        >
                          <Eye className="size-3.5" />
                          <span>Lihat Kiriman ({assignment.totalSubmissions})</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive-text hover:bg-destructive/10"
                          onClick={() => setDeletingAssignment(assignment)}
                          title="Hapus Tugas"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: CREATE ASSIGNMENT */}
        <TabsContent value="create" className="mt-6">
          <Card className="border-border bg-surface shadow-xs max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 text-accent-text">
                <FilePlus2 className="size-5" />
                <CardTitle className="text-xl">Tambah Tugas Baru</CardTitle>
              </div>
              <CardDescription>
                Tugas yang dibuat akan langsung tampil di menu /akademik/tugas untuk seluruh siswa
                kelas XII RPL 3.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                ref={formRef}
                action={createAction}
                className="grid gap-4 sm:grid-cols-2"
                noValidate
              >
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`${formId}-title`}>Judul Tugas</Label>
                  <Input
                    id={`${formId}-title`}
                    name="title"
                    required
                    maxLength={150}
                    placeholder="Contoh: Praktikum REST API dengan Node.js"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${formId}-subject`}>Mata Pelajaran</Label>
                  <Select name="subjectId" defaultValue="none">
                    <SelectTrigger id={`${formId}-subject`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">- Umum (tanpa mata pelajaran) -</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${formId}-due`}>Tenggat Pengumpulan</Label>
                  <Input id={`${formId}-due`} name="dueDate" type="datetime-local" required />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`${formId}-description`}>Petunjuk & Deskripsi (opsional)</Label>
                  <Textarea
                    id={`${formId}-description`}
                    name="description"
                    maxLength={1000}
                    rows={4}
                    placeholder="Instruksi pengerjaan, format berkas, atau kriteria penilaian..."
                  />
                </div>

                <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                  <Button type="submit" disabled={isCreating} className="gap-2">
                    {isCreating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Menyimpan Tugas...</span>
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="size-4" />
                        <span>Publikasikan Tugas</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("list")}
                    disabled={isCreating}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: INSPECT SUBMISSIONS */}
      <Dialog
        open={Boolean(inspectingAssignment)}
        onOpenChange={(open) => !open && setInspectingAssignment(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-accent/40 text-accent-text">
                {inspectingAssignment?.subjectName ?? "Umum"}
              </Badge>
              <span className="font-mono text-xs text-muted">
                Tenggat:{" "}
                {inspectingAssignment
                  ? new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(inspectingAssignment.dueDate))
                  : ""}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold mt-1">
              {inspectingAssignment?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daftar seluruh kiriman berkas tugas dari siswa kelas XII RPL 3.
            </DialogDescription>
          </DialogHeader>

          {/* Submissions Stats strip */}
          <div className="shrink-0 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 my-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <UserCheck className="size-4 text-emerald-500" />
                <span>
                  Terkumpul:{" "}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {inspectingAssignment?.totalSubmissions}
                  </strong>
                </span>
              </div>
              <span className="text-muted text-xs">·</span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <UserX className="size-4 text-amber-500" />
                <span>
                  Belum Mengumpulkan:{" "}
                  <strong className="text-amber-700 dark:text-amber-400">
                    {inspectingAssignment?.pendingStudents.length}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={modalTab === "submitted" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setModalTab("submitted")}
              >
                Sudah Kirim ({inspectingAssignment?.totalSubmissions})
              </Button>
              <Button
                variant={modalTab === "pending" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setModalTab("pending")}
              >
                Belum Kirim ({inspectingAssignment?.pendingStudents.length})
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {modalTab === "submitted" ? (
              <div className="flex flex-col gap-3 py-2">
                {inspectingAssignment?.submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                    <UserX className="size-8 mb-2 opacity-50" />
                    <p className="text-sm">Belum ada siswa yang mengumpulkan tugas ini.</p>
                  </div>
                ) : (
                  inspectingAssignment?.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3.5 transition-colors hover:border-accent/40"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-semibold text-accent-text">
                          {sub.absenNumber ?? "-"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {sub.studentName}
                            </span>
                            {sub.reviewedByStaff ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              >
                                Sudah Ditinjau
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              >
                                Belum Ditinjau
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                            <Clock className="size-3" />
                            <span>
                              Dikirim:{" "}
                              {new Intl.DateTimeFormat("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(sub.submittedAt))}
                            </span>
                          </div>

                          {sub.notes ? (
                            <p className="mt-1.5 rounded-md border border-border/80 bg-background/60 p-2 text-xs text-foreground/90 italic">
                              &ldquo;{sub.notes}&rdquo;
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                          <a href={sub.fileUrl} target="_blank" rel="noreferrer">
                            <FileCheck2 className="size-3.5 text-accent-text" />
                            <span>Buka Berkas</span>
                            <ExternalLink className="size-3 opacity-60" />
                          </a>
                        </Button>

                        <Button
                          variant={sub.reviewedByStaff ? "outline" : "default"}
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          disabled={isPending}
                          onClick={() => handleToggleReviewed(sub.id, sub.reviewedByStaff)}
                          title={
                            sub.reviewedByStaff
                              ? "Klik untuk membatalkan status ditinjau"
                              : "Tandai tugas ini sudah diperiksa"
                          }
                        >
                          <Check className="size-3.5" />
                          <span>{sub.reviewedByStaff ? "Tinjau Ulang" : "Tandai Ditinjau"}</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="py-2">
                <div className="mb-3 text-xs text-muted">
                  Siswa yang belum mengumpulkan tugas ini (
                  {inspectingAssignment?.pendingStudents.length} orang):
                </div>

                {inspectingAssignment?.pendingStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-8 mb-2" />
                    <p className="text-sm font-semibold">
                      Luar biasa! Seluruh siswa telah mengumpulkan tugas ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {inspectingAssignment?.pendingStudents.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/60 font-mono text-[10px] text-muted font-bold">
                          {st.absenNumber ?? "-"}
                        </span>
                        <span className="font-medium text-foreground truncate">{st.fullName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-border pt-3 mt-2">
            <Button variant="outline" size="sm" onClick={() => setInspectingAssignment(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION: DELETE ASSIGNMENT */}
      <Dialog
        open={Boolean(deletingAssignment)}
        onOpenChange={(open) => !open && setDeletingAssignment(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tugas{" "}
              <span className="font-semibold text-foreground">{deletingAssignment?.title}</span>?
              Seluruh data kiriman siswa untuk tugas ini juga akan terhapus secara permanen.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingAssignment(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment} disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus Tugas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
