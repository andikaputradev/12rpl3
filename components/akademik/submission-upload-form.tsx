"use client";

import { CheckCircle2, FileCheck, FileText, Loader2, Upload } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
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
  const [selectedFileNotice, setSelectedFileNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);
      const msg = existingFileUrl
        ? `Kiriman tugas berhasil diperbarui pada pukul ${timeStr} WIB.`
        : `Tugas berhasil dikumpulkan pada pukul ${timeStr} WIB.`;
      setSuccessNotice(msg);
      toast.success(msg);
      setSelectedFileNotice(null);
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, existingFileUrl]);

  return (
    <form action={formAction} className="flex flex-col gap-3.5 border-border border-t pt-3">
      {/* Success Notification Banner */}
      {successNotice ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 text-xs dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-file`} className="text-xs font-medium">
          {existingFileUrl
            ? "Ganti Berkas Tugas (opsional)"
            : "Pilih Berkas Tugas (PDF atau Gambar)"}
        </Label>
        <Input
          id={`${formId}-file`}
          name="file"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          required={!existingFileUrl}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
              setSelectedFileNotice(`${file.name} (${sizeInMb} MB)`);
            } else {
              setSelectedFileNotice(null);
            }
          }}
          className="cursor-pointer file:cursor-pointer text-xs"
        />
        {selectedFileNotice ? (
          <p className="flex items-center gap-1.5 text-xs text-accent-text">
            <FileText className="size-3.5" />
            <span>Berkas siap diunggah: {selectedFileNotice}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-notes`} className="text-xs font-medium">
          Catatan Tambahan untuk Guru (opsional)
        </Label>
        <Input
          id={`${formId}-notes`}
          name="notes"
          maxLength={500}
          defaultValue={existingNotes ?? ""}
          placeholder="Misal: tautan repository GitHub atau keterangan pengerjaan..."
          className="text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button type="submit" disabled={isPending} size="sm" className="gap-2 text-xs">
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Mengunggah...
            </>
          ) : (
            <>
              <Upload className="size-3.5" />
              {existingFileUrl ? "Kirim Ulang Tugas" : "Kumpulkan Tugas"}
            </>
          )}
        </Button>

        {existingFileUrl ? (
          <a
            href={existingFileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-accent-text text-xs underline underline-offset-2 transition-colors hover:text-accent"
          >
            <FileCheck className="size-3.5" />
            Lihat Berkas Terkirim
          </a>
        ) : null}
      </div>
    </form>
  );
}
