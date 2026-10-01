"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ActionState,
  createBlogCategory,
  deleteBlogCategory,
} from "@/lib/actions/admin-blog-mutations";

const initialState: ActionState = {};

export function BlogCategoryManager({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createBlogCategory, initialState);
  const [items, setItems] = useState(categories);
  const [isDeleting, startDeleteTransition] = useTransition();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success("Kategori ditambahkan.");
      formRef.current?.reset();
    }
  }, [state]);

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteBlogCategory(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Kategori dihapus.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${formId}-name`}>Nama Kategori Baru</Label>
          <Input
            id={`${formId}-name`}
            name="name"
            required
            maxLength={50}
            placeholder="Kegiatan Kelas"
          />
        </div>
        <Button type="submit" disabled={isPending} size="sm">
          <Plus className="size-4" /> Tambah
        </Button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <li className="text-muted text-sm">Belum ada kategori.</li>
        ) : (
          items.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pr-1.5 pl-3 text-sm"
            >
              {category.name}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(category.id)}
                aria-label={`Hapus kategori ${category.name}`}
                className="cursor-pointer rounded-full p-1 text-muted hover:bg-destructive/10 hover:text-destructive-text"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
