"use client";

import { Megaphone, Pin } from "lucide-react";
import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, createAnnouncement } from "@/lib/actions/admin-akademik-mutations";
import type { Announcement } from "@/lib/db/schema";

const initialState: ActionState = {};

export function AnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  const [state, formAction, isPending] = useActionState(createAnnouncement, initialState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Pengumuman ditambahkan.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  const sorted = [...announcements].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengumuman</CardTitle>
        <CardDescription>
          Tampil untuk seluruh peran terautentikasi (siswa, pengurus, staf) di /akademik/pengumuman.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-title`}>Judul</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={150} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-content`}>Isi Pengumuman</Label>
            <Textarea id={`${formId}-content`} name="content" required maxLength={5000} rows={4} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id={`${formId}-pinned`}
              name="isPinned"
              type="checkbox"
              value="true"
              className="size-4 cursor-pointer rounded border-border accent-[var(--color-accent)]"
            />
            <Label htmlFor={`${formId}-pinned`} className="cursor-pointer">
              Sematkan di atas
            </Label>
          </div>
          <div>
            <Button type="submit" disabled={isPending}>
              <Megaphone className="size-4" />
              {isPending ? "Menambahkan..." : "Tambah Pengumuman"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {sorted.length === 0 ? (
            <li className="py-4 text-center text-muted text-sm">Belum ada pengumuman.</li>
          ) : (
            sorted.map((announcement) => (
              <li key={announcement.id} className="rounded-md border border-border px-3 py-2.5">
                <p className="flex items-center gap-1.5 font-medium text-sm">
                  {announcement.isPinned ? (
                    <Pin className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                  ) : null}
                  {announcement.title}
                </p>
                <p className="mt-1 line-clamp-2 text-muted text-xs">{announcement.content}</p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
