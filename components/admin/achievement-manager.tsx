"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Award, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  type ActionState,
  createAchievement,
  deleteAchievement,
} from "@/lib/actions/admin-prestasi-mutations";
import { achievementLevelValues } from "@/lib/validations/prestasi";

const initialState: ActionState = {};

const LEVEL_LABELS: Record<string, string> = {
  sekolah: "Sekolah",
  kabupaten: "Kabupaten",
  provinsi: "Provinsi",
  nasional: "Nasional",
  internasional: "Internasional",
};

interface AchievementListItem {
  id: string;
  title: string;
  level: string;
  eventDate: Date | null;
}

export function AchievementManager({
  achievements,
  students,
}: {
  achievements: AchievementListItem[];
  students: { id: string; fullName: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createAchievement, initialState);
  const [items, setItems] = useState(achievements);
  const [isDeleting, startDeleteTransition] = useTransition();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success("Prestasi ditambahkan.");
      formRef.current?.reset();
    }
  }, [state]);

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteAchievement(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Prestasi dihapus.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prestasi</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-title`}>Judul Prestasi</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={150} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-level`}>Tingkat</Label>
            <Select name="level" defaultValue="sekolah">
              <SelectTrigger id={`${formId}-level`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {achievementLevelValues.map((level) => (
                  <SelectItem key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-date`}>Tanggal Acara (opsional)</Label>
            <Input id={`${formId}-date`} name="eventDate" type="date" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-description`}>Deskripsi (opsional)</Label>
            <Textarea id={`${formId}-description`} name="description" maxLength={1000} rows={3} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-certificate`}>Sertifikat (opsional)</Label>
            <Input
              id={`${formId}-certificate`}
              name="certificate"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Peserta (kosongkan bila prestasi tingkat kelas)</Label>
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3">
              {students.map((student) => {
                const checkboxId = `${formId}-participant-${student.id}`;
                return (
                  <div key={student.id} className="flex items-center gap-2">
                    <Checkbox id={checkboxId} name="participantIds" value={student.id} />
                    <Label htmlFor={checkboxId} className="cursor-pointer font-normal text-sm">
                      {student.fullName}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              <Plus className="size-4" />
              {isPending ? "Menambahkan..." : "Tambah Prestasi"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {items.length === 0 ? (
            <li className="py-4 text-center text-muted text-sm">Belum ada prestasi.</li>
          ) : (
            items.map((achievement) => (
              <li
                key={achievement.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Award className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{achievement.title}</p>
                    <p className="text-muted text-xs">
                      {LEVEL_LABELS[achievement.level]}
                      {achievement.eventDate
                        ? ` · ${format(achievement.eventDate, "d MMMM yyyy", { locale: idLocale })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => handleDelete(achievement.id)}
                  aria-label={`Hapus prestasi ${achievement.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
