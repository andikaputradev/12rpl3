"use client";

import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSubject, deleteSubject } from "@/lib/actions/admin-akademik-mutations";

interface SubjectManagerDialogProps {
  subjects: { id: string; name: string }[];
}

export function SubjectManagerDialog({ subjects }: SubjectManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    startTransition(async () => {
      const res = await createSubject(newSubjectName.trim());
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Mata pelajaran "${newSubjectName.trim()}" berhasil ditambahkan.`);
      setNewSubjectName("");
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus mata pelajaran "${name}"? Data nilai terkait mungkin terdampak.`)) return;

    startTransition(async () => {
      const res = await deleteSubject(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Mata pelajaran "${name}" berhasil dihapus.`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <BookOpen className="size-3.5" />
          <span>Kelola Mata Pelajaran</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola Mata Pelajaran</DialogTitle>
          <DialogDescription>
            Tambah atau hapus daftar mata pelajaran untuk entry nilai dan jadwal kelas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex gap-2 mt-2">
          <Input
            placeholder="Nama mata pelajaran baru..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            disabled={isPending}
          />
          <Button
            type="submit"
            disabled={isPending || !newSubjectName.trim()}
            className="gap-1 shrink-0"
          >
            <Plus className="size-4" />
            <span>Tambah</span>
          </Button>
        </form>

        <div className="mt-4 flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {subjects.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted">
              Belum ada mata pelajaran. Silakan tambahkan di atas.
            </p>
          ) : (
            subjects.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm bg-surface"
              >
                <span className="font-medium text-foreground">{sub.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted hover:text-destructive-text"
                  onClick={() => handleDelete(sub.id, sub.name)}
                  disabled={isPending}
                  aria-label={`Hapus ${sub.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
