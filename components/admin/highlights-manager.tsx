"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ActionState } from "@/lib/actions/admin-profil";
import { createHighlight, deleteHighlight, updateHighlight } from "@/lib/actions/admin-profil";
import type { BerandaHighlight } from "@/lib/db/schema";

const initialState: ActionState = {};

export function HighlightsManager({ highlights }: { highlights: BerandaHighlight[] }) {
  const [state, formAction, isPending] = useActionState(createHighlight, initialState);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isToggling, startToggleTransition] = useTransition();
  const lastTimestamp = useRef<number | undefined>(undefined);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Highlight ditambahkan.");
      formRef.current?.reset();
      setPhotoName(null);
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteHighlight(id);
      if (result.error) toast.error(result.error);
      else toast.success("Highlight dihapus.");
    });
  }

  function handleToggleActive(highlight: BerandaHighlight) {
    setTogglingId(highlight.id);
    startToggleTransition(async () => {
      const result = await updateHighlight(highlight.id, {
        title: highlight.title,
        description: highlight.description,
        isActive: !highlight.isActive,
      });
      if (result.error) toast.error(result.error);
      else toast.success(highlight.isActive ? "Highlight dinonaktifkan." : "Highlight diaktifkan.");
      setTogglingId(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sorotan Kegiatan (Beranda)</CardTitle>
        <CardDescription>Maksimum 4 kartu aktif ditampilkan di Beranda, terurut.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-title`}>Judul</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={100} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-link`}>Tautan (opsional)</Label>
            <Input id={`${formId}-link`} name="linkHref" placeholder="/galeri atau https://..." />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-desc`}>Deskripsi (maks. 120 karakter)</Label>
            <Input id={`${formId}-desc`} name="description" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-order`}>Urutan Tampil</Label>
            <Input
              id={`${formId}-order`}
              name="displayOrder"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-image`}>Gambar</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" asChild>
                <label htmlFor={`${formId}-image`} className="cursor-pointer">
                  <Upload className="size-4" />
                  Pilih Berkas
                </label>
              </Button>
              <span className="truncate text-xs text-muted">{photoName ?? "Wajib diisi"}</span>
            </div>
            <input
              id={`${formId}-image`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
            />
          </div>
          <input type="hidden" name="isActive" value="true" />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              <ImagePlus className="size-4" />
              {isPending ? "Menambahkan..." : "Tambah Highlight"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {highlights.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">Belum ada highlight.</li>
          ) : (
            highlights.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.title}</p>
                  <p className="truncate text-xs text-muted">{h.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(h)}
                    disabled={isToggling && togglingId === h.id}
                    className="cursor-pointer disabled:cursor-wait disabled:opacity-60"
                    aria-label={`Ubah status highlight ${h.title} menjadi ${h.isActive ? "nonaktif" : "aktif"}`}
                  >
                    <Badge variant={h.isActive ? "success" : "outline"}>
                      {h.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isDeleting}
                    onClick={() => handleDelete(h.id)}
                    aria-label={`Hapus highlight ${h.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
