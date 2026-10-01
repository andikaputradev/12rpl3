"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions/admin-profil";
import { updateClassProfile } from "@/lib/actions/admin-profil";
import type { ClassProfile } from "@/lib/db/schema";

const initialState: ActionState = {};

interface MisiItem {
  id: string;
  value: string;
}

function toMisiItems(misi: string[] | undefined): MisiItem[] {
  const source = misi?.length ? misi : [""];
  return source.map((value) => ({ id: crypto.randomUUID(), value }));
}

export function ClassProfileForm({ classProfile }: { classProfile: ClassProfile | null }) {
  const [state, formAction, isPending] = useActionState(updateClassProfile, initialState);
  const [misi, setMisi] = useState<MisiItem[]>(() => toMisiItems(classProfile?.misi));
  const [photoName, setPhotoName] = useState<string | null>(null);
  const lastTimestamp = useRef<number | undefined>(undefined);
  const formId = useId();

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Profil kelas tersimpan.");
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function addMisi() {
    setMisi((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  }

  function removeMisi(id: string) {
    setMisi((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function updateMisi(id: string, value: string) {
    setMisi((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Kelas</CardTitle>
        <CardDescription>
          Sejarah, visi, misi, tahun ajaran, dan foto kelas utama yang tampil di Beranda & Profil
          Kelas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-6" noValidate>
          <input
            type="hidden"
            name="misi"
            value={JSON.stringify(misi.map((m) => m.value).filter((v) => v.trim()))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-motto`}>Motto</Label>
              <Input
                id={`${formId}-motto`}
                name="motto"
                defaultValue={classProfile?.motto}
                required
                placeholder="Mis. Berkarya lewat kode, berkarakter lewat budaya."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-tahunAjaran`}>Tahun Ajaran</Label>
              <Input
                id={`${formId}-tahunAjaran`}
                name="tahunAjaran"
                defaultValue={classProfile?.tahunAjaran}
                required
                placeholder="2026/2027"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-sejarah`}>Sejarah</Label>
            <textarea
              id={`${formId}-sejarah`}
              name="sejarah"
              defaultValue={classProfile?.sejarah}
              required
              rows={6}
              className="flex w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-[color,box-shadow] placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
              placeholder="Riwayat pembentukan dan perjalanan kelas..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-visi`}>Visi</Label>
            <textarea
              id={`${formId}-visi`}
              name="visi"
              defaultValue={classProfile?.visi}
              required
              rows={2}
              className="flex w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-[color,box-shadow] placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Misi</Label>
            {misi.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="w-6 shrink-0 font-mono text-xs text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Input
                  value={item.value}
                  onChange={(e) => updateMisi(item.id, e.target.value)}
                  placeholder={`Poin misi ke-${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMisi(item.id)}
                  disabled={misi.length <= 1}
                  aria-label="Hapus poin misi"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addMisi} className="w-fit">
              <Plus className="size-4" />
              Tambah Poin Misi
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-foto`}>Foto Kelas Utama</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" asChild>
                <label htmlFor={`${formId}-foto`} className="cursor-pointer">
                  <Upload className="size-4" />
                  Pilih Berkas
                </label>
              </Button>
              <span className="text-xs text-muted">{photoName ?? "JPEG/PNG/WebP, maks. 5MB"}</span>
            </div>
            <input
              id={`${formId}-foto`}
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? "Menyimpan..." : "Simpan Profil Kelas"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
