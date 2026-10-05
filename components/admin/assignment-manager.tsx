"use client";

import { FilePlus2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, createAssignment } from "@/lib/actions/admin-akademik-mutations";
import type { Assignment } from "@/lib/db/schema";

const initialState: ActionState = {};

export function AssignmentManager({
  assignments,
  subjects,
}: {
  assignments: Assignment[];
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createAssignment, initialState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Tugas ditambahkan.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  const sorted = [...assignments].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Tugas</CardTitle>
        <CardDescription>
          Tugas yang ditambahkan langsung tampil di /akademik/tugas untuk seluruh siswa.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-title`}>Judul Tugas</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={150} />
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
            <Label htmlFor={`${formId}-due`}>Tenggat</Label>
            <Input id={`${formId}-due`} name="dueDate" type="datetime-local" required />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-description`}>Deskripsi (opsional)</Label>
            <Textarea id={`${formId}-description`} name="description" maxLength={1000} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              <FilePlus2 className="size-4" />
              {isPending ? "Menambahkan..." : "Tambah Tugas"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {sorted.length === 0 ? (
            <li className="py-4 text-center text-muted text-sm">Belum ada tugas.</li>
          ) : (
            sorted.map((assignment) => (
              <li key={assignment.id} className="rounded-md border border-border px-3 py-2.5">
                <p className="font-medium text-sm">{assignment.title}</p>
                <p className="font-mono text-muted text-xs">
                  Tenggat{" "}
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(assignment.dueDate)}
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
