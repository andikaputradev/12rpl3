"use client";

import { FolderPlus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { AdminGaleriState } from "@/lib/actions/admin-galeri";
import { createAlbum, deleteAlbum } from "@/lib/actions/admin-galeri";
import type { GalleryAlbum } from "@/lib/db/schema";
import { galleryCategories, galleryCategoryLabels } from "@/lib/validations/galeri";

const initialState: AdminGaleriState = {};

export function AlbumManager({ albums }: { albums: GalleryAlbum[] }) {
  const [state, formAction, isPending] = useActionState(createAlbum, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();
  const lastTimestamp = useRef<number | undefined>(undefined);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Album dibuat.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  function handleDelete(id: string, title: string) {
    if (
      !confirm(`Hapus album "${title}" beserta seluruh isinya? Tindakan ini tidak bisa dibatalkan.`)
    ) {
      return;
    }
    startDeleteTransition(async () => {
      const result = await deleteAlbum(id);
      if (result.error) toast.error(result.error);
      else toast.success("Album dihapus.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Album</CardTitle>
        <CardDescription>Pembuatan album adalah wewenang Pengurus ke atas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-title`}>Judul Album</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-category`}>Kategori</Label>
            <select
              id={`${formId}-category`}
              name="category"
              required
              className="flex h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {galleryCategories.map((c) => (
                <option key={c} value={c}>
                  {galleryCategoryLabels[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-date`}>Tanggal Event (opsional)</Label>
            <Input id={`${formId}-date`} name="eventDate" type="date" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-desc`}>Deskripsi (opsional)</Label>
            <Textarea id={`${formId}-desc`} name="description" rows={2} maxLength={500} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              <FolderPlus className="size-4" />
              {isPending ? "Membuat..." : "Buat Album"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {albums.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">Belum ada album.</li>
          ) : (
            albums.map((album) => (
              <li
                key={album.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium">{album.title}</span>
                  <Badge variant="outline">{galleryCategoryLabels[album.category]}</Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  onClick={() => handleDelete(album.id, album.title)}
                  aria-label={`Hapus album ${album.title}`}
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
