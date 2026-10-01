"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateKelulusanContent } from "@/lib/actions/admin-kelulusan-mutations";
import type { KelulusanContent } from "@/lib/db/schema";

interface KelulusanContentFormProps {
  content: KelulusanContent;
}

const initialState = { error: undefined, success: undefined, timestamp: undefined };

export function KelulusanContentForm({ content }: KelulusanContentFormProps) {
  const [state, formAction, isPending] = useActionState(updateKelulusanContent, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Konten Corner Kelulusan tersimpan.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="space-y-1.5">
        <Label htmlFor="kelulusan-intro">Teks Pengantar</Label>
        <Textarea
          id="kelulusan-intro"
          name="introText"
          maxLength={2000}
          rows={4}
          defaultValue={content.introText ?? ""}
          placeholder="Teks pembuka yang tampil di atas halaman Corner Kelulusan..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="kelulusan-video">Tautan Video Kompilasi (YouTube)</Label>
        <Input
          id="kelulusan-video"
          name="compilationVideoUrl"
          type="url"
          defaultValue={content.compilationVideoUrl ?? ""}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        Simpan
      </Button>
    </form>
  );
}
