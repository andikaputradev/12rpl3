"use client";

import { Plus, Quote, Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  type ActionState,
  createAlumniTestimonial,
  deleteAlumniTestimonial,
} from "@/lib/actions/admin-prestasi-mutations";

const initialState: ActionState = {};

interface TestimonialListItem {
  id: string;
  name: string;
  quote: string;
}

export function AlumniManager({ testimonials }: { testimonials: TestimonialListItem[] }) {
  const [state, formAction, isPending] = useActionState(createAlumniTestimonial, initialState);
  const [items, setItems] = useState(testimonials);
  const [isDeleting, startDeleteTransition] = useTransition();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success("Testimoni ditambahkan.");
      formRef.current?.reset();
    }
  }, [state]);

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteAlumniTestimonial(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Testimoni dihapus.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testimoni Alumni</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-name`}>Nama Alumni</Label>
            <Input id={`${formId}-name`} name="name" required maxLength={100} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-context`}>Catatan Konteks (opsional)</Label>
            <Input
              id={`${formId}-context`}
              name="contextNote"
              maxLength={200}
              placeholder="Mahasiswa Teknik Informatika, UGM"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-quote`}>Kutipan</Label>
            <Textarea
              id={`${formId}-quote`}
              name="quote"
              required
              minLength={10}
              maxLength={1000}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-photo`}>Foto (opsional)</Label>
            <Input
              id={`${formId}-photo`}
              name="photo"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              <Plus className="size-4" />
              {isPending ? "Menambahkan..." : "Tambah Testimoni"}
            </Button>
          </div>
        </form>

        <Separator />

        <ul className="flex flex-col gap-2">
          {items.length === 0 ? (
            <li className="py-4 text-center text-muted text-sm">Belum ada testimoni.</li>
          ) : (
            items.map((testimonial) => (
              <li
                key={testimonial.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Quote className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="truncate text-muted text-xs">{testimonial.quote}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => handleDelete(testimonial.id)}
                  aria-label={`Hapus testimoni ${testimonial.name}`}
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
