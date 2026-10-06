"use client";

import { ImageIcon, Upload, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type UploadActionState, uploadGalleryItem } from "@/lib/actions/galeri-mutations";

const initialState: UploadActionState = {};

interface UploadFormProps {
  albums: { id: string; title: string; slug: string }[];
}

export function UploadForm({ albums }: UploadFormProps) {
  const [state, formAction, isPending] = useActionState(uploadGalleryItem, initialState);
  const [type, setType] = useState<"image" | "video">("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const formId = useId();
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success(
        state.status === "approved"
          ? "Terkirim dan langsung tayang."
          : "Terkirim, menunggu moderasi.",
      );
      router.push("/galeri/kiriman-saya");
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  if (albums.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-10 text-center text-sm text-muted">
        Belum ada album tersedia. Hubungi Pengurus/Wali Kelas untuk membuat album terlebih dulu.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-album`}>Album</Label>
        <select
          id={`${formId}-album`}
          name="albumId"
          required
          className="flex h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "image" ? "default" : "outline"}
          size="sm"
          onClick={() => setType("image")}
        >
          <ImageIcon className="size-4" />
          Foto
        </Button>
        <Button
          type="button"
          variant={type === "video" ? "default" : "outline"}
          size="sm"
          onClick={() => setType("video")}
        >
          <Video className="size-4" />
          Video YouTube
        </Button>
      </div>
      <input type="hidden" name="type" value={type} />

      {type === "image" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-image`}>Berkas Gambar</Label>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <label htmlFor={`${formId}-image`} className="cursor-pointer">
                <Upload className="size-4" />
                Pilih Berkas
              </label>
            </Button>
            <span className="text-xs text-muted">JPEG/PNG/WebP, maks. 10MB</span>
          </div>
          <input
            id={`${formId}-image`}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="sr-only"
            onChange={handleFileChange}
          />
          {previewUrl ? (
            <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border border-border bg-background">
              {/* biome-ignore lint/performance/noImgElement: pratinjau lokal dari blob: URL sebelum unggah, next/image tidak relevan untuk objectURL sementara. */}
              <img
                src={previewUrl}
                alt="Pratinjau gambar yang akan diunggah"
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-youtube`}>Tautan YouTube</Label>
          <Input
            id={`${formId}-youtube`}
            name="youtubeUrl"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted">Diverifikasi otomatis ke YouTube sebelum disimpan.</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-caption`}>Caption (opsional)</Label>
        <Textarea id={`${formId}-caption`} name="caption" rows={3} maxLength={280} />
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Mengirim..." : "Kirim"}
      </Button>
    </form>
  );
}
