"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ActionState, submitAssignment } from "@/lib/actions/akademik-mutations";

const initialState: ActionState = {};

export function SubmissionUploadForm({
  assignmentId,
  existingFileUrl,
  existingNotes,
}: {
  assignmentId: string;
  existingFileUrl: string | null;
  existingNotes: string | null;
}) {
  const boundAction = submitAssignment.bind(null, assignmentId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const formId = useId();
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success(existingFileUrl ? "Kiriman diperbarui." : "Tugas berhasil dikumpulkan.");
    }
    if (state.error) toast.error(state.error);
  }, [state, existingFileUrl]);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-border border-t pt-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-file`}>
          {existingFileUrl ? "Ganti berkas (opsional)" : "Berkas (gambar atau PDF)"}
        </Label>
        <Input
          id={`${formId}-file`}
          name="file"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          required={!existingFileUrl}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-notes`}>Catatan (opsional)</Label>
        <Input
          id={`${formId}-notes`}
          name="notes"
          maxLength={500}
          defaultValue={existingNotes ?? ""}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Mengunggah..." : existingFileUrl ? "Kirim Ulang" : "Kumpulkan Tugas"}
        </Button>
        {existingFileUrl ? (
          <a
            href={existingFileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent-text text-sm underline underline-offset-2"
          >
            Lihat kiriman saat ini
          </a>
        ) : null}
      </div>
    </form>
  );
}
