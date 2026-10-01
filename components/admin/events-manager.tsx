"use client";

import { CalendarPlus, Star, Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ActionState } from "@/lib/actions/admin-jadwal";
import {
  createAcademicEvent,
  deleteAcademicEvent,
  setFeaturedCountdown,
} from "@/lib/actions/admin-jadwal";
import {
  EVENT_CATEGORY_COLOR_VAR,
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_OPTIONS,
} from "@/lib/config/event-category";
import type { AcademicEvent } from "@/lib/db/schema";

const initialState: ActionState = {};

export function EventsManager({ events }: { events: AcademicEvent[] }) {
  const [state, formAction, isPending] = useActionState(createAcademicEvent, initialState);
  const [isSettingFeatured, startFeaturedTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const lastTimestamp = useRef<number | undefined>(undefined);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Agenda ditambahkan.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  function handleSetFeatured(id: string) {
    startFeaturedTransition(async () => {
      const result = await setFeaturedCountdown(id);
      if (result.error) toast.error(result.error);
      else toast.success("Countdown unggulan diperbarui.");
    });
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteAcademicEvent(id);
      if (result.error) toast.error(result.error);
      else toast.success("Agenda dihapus.");
    });
  }

  const sorted = [...events].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda Akademik</CardTitle>
        <CardDescription>
          Dipakai bersama sebagai sumber Kalender Akademik di halaman Jadwal & Agenda. Tandai satu
          agenda sebagai countdown unggulan di status bar Beranda.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-title`}>Judul Agenda</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={150} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-date`}>Tanggal & Waktu</Label>
            <Input id={`${formId}-date`} name="eventDate" type="datetime-local" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-category`}>Kategori</Label>
            <select
              id={`${formId}-category`}
              name="category"
              defaultValue="lainnya"
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {EVENT_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {EVENT_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-description`}>Deskripsi (opsional)</Label>
            <Input id={`${formId}-description`} name="description" maxLength={500} />
          </div>
          <div className="flex items-center gap-2 self-end pb-2.5">
            <input
              id={`${formId}-featured`}
              name="isFeaturedCountdown"
              type="checkbox"
              value="true"
              className="size-4 cursor-pointer rounded border-border accent-[var(--color-accent)]"
            />
            <Label htmlFor={`${formId}-featured`} className="cursor-pointer">
              Jadikan countdown unggulan
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              <CalendarPlus className="size-4" />
              {isPending ? "Menambahkan..." : "Tambah Agenda"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {sorted.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">Belum ada agenda.</li>
          ) : (
            sorted.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_CATEGORY_COLOR_VAR[event.category] }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="font-mono text-xs text-muted">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(event.eventDate)}{" "}
                      · {EVENT_CATEGORY_LABELS[event.category]}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {event.isFeaturedCountdown ? (
                    <Badge>
                      <Star className="size-3" /> Unggulan
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSettingFeatured}
                      onClick={() => handleSetFeatured(event.id)}
                    >
                      Jadikan Unggulan
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    aria-label={`Hapus agenda ${event.title}`}
                    onClick={() => handleDelete(event.id)}
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
