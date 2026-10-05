"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { submitAspiration } from "@/lib/actions/interaksi-mutations";

const initialState = { error: undefined, success: undefined, timestamp: undefined };

export function AspirationForm() {
  const [state, formAction, isPending] = useActionState(submitAspiration, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // isAnonymous sengaja TIDAK dimasukkan sebagai dependency: efek ini sendiri
  // memanggil setIsAnonymous(false) saat sukses, sehingga menambahkannya ke
  // deps akan memicu efek berjalan ulang dan menampilkan toast sukses ganda.
  // Efek hanya boleh bereaksi terhadap perubahan `state` (hasil submit).
  // biome-ignore lint/correctness/useExhaustiveDependencies: lihat alasan di atas
  useEffect(() => {
    if (state.success) {
      const msg = isAnonymous
        ? "Aspirasi terkirim. Aspirasi anonim akan tampil setelah ditinjau oleh staf."
        : "Aspirasi terkirim dan langsung tampil di papan aspirasi kelas.";
      setSuccessNotice(msg);
      toast.success(msg);
      formRef.current?.reset();
      setIsAnonymous(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {successNotice ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-900 text-sm dark:text-emerald-200">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="aspiration-content">Aspirasi</Label>
        <Textarea
          id="aspiration-content"
          name="content"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder="Sampaikan masukan, ide, atau keluhan untuk kelas..."
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-3.5 py-3">
        <div>
          <Label htmlFor="aspiration-anonymous">Kirim sebagai anonim</Label>
          <p className="text-muted text-xs">
            Aspirasi anonim ditinjau staf lebih dulu sebelum tampil publik.
          </p>
        </div>
        <Switch
          id="aspiration-anonymous"
          checked={isAnonymous}
          onCheckedChange={setIsAnonymous}
          name="isAnonymousToggle"
        />
      </div>
      {isAnonymous ? <input type="hidden" name="isAnonymous" value="on" /> : null}

      <p className="text-muted text-xs">Butuh bantuan? Hubungi guru BK atau Wali Kelas.</p>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        Kirim Aspirasi
      </Button>
    </form>
  );
}
