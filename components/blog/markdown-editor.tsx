"use client";

import { Bold, Heading2, Image as ImageIcon, Italic, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CreateDraftResult, createDraftPost } from "@/lib/actions/blog-mutations";

const initialState: CreateDraftResult = {};

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const newValue = `${textarea.value.slice(0, start)}${before}${selected}${after}${textarea.value.slice(end)}`;
  return {
    newValue,
    cursorStart: start + before.length,
    cursorEnd: start + before.length + selected.length,
  };
}

/**
 * "Simpan Draf" adalah SATU-SATUNYA fungsi inti form ini (Bagian 6 brief:
 * "tidak boleh bergantung pada toolbar; toolbar murni kenyamanan tambahan")
 * - tombol toolbar hanya menyisipkan sintaks di posisi kursor, textarea dan
 * submit tetap berfungsi penuh sekalipun seluruh tombol toolbar tidak
 * pernah disentuh. Kirim-untuk-tinjau/terbitkan terjadi di halaman
 * Tulisan Saya setelah draf tersimpan (dua langkah eksplisit, bukan
 * digabung di sini) agar setiap langkah tetap sederhana dan dapat diuji.
 */
export function MarkdownEditor({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createDraftPost, initialState);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formId = useId();
  const router = useRouter();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success && state.id) {
      toast.success("Draf tersimpan.");
      router.push("/blog/tulisan-saya");
    }
  }, [state, router]);

  function applyToolbar(before: string, after: string, placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { newValue, cursorStart, cursorEnd } = insertAtCursor(
      textarea,
      before,
      after,
      placeholder,
    );
    setContent(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-title`}>Judul</Label>
          <Input id={`${formId}-title`} name="title" required maxLength={150} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-category`}>Kategori (opsional)</Label>
          <Select name="categoryId" defaultValue="none">
            <SelectTrigger id={`${formId}-category`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">- Tanpa kategori -</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-tags`}>Tag (pisahkan dengan koma, opsional)</Label>
        <Input id={`${formId}-tags`} name="tags" placeholder="kegiatan, tutorial, opini" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-excerpt`}>
          Ringkasan (opsional - dibuat otomatis bila kosong)
        </Label>
        <Input id={`${formId}-excerpt`} name="excerpt" maxLength={300} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-cover`}>Cover Image (opsional)</Label>
        <Input
          id={`${formId}-cover`}
          name="coverImage"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-content`}>Isi Artikel (Markdown)</Label>
        <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-border border-b-0 bg-background p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Tebal"
            onClick={() => applyToolbar("**", "**", "teks tebal")}
          >
            <Bold className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Miring"
            onClick={() => applyToolbar("_", "_", "teks miring")}
          >
            <Italic className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Heading"
            onClick={() => applyToolbar("## ", "", "Judul Bagian")}
          >
            <Heading2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Sisipkan tautan"
            onClick={() => applyToolbar("[", "](https://)", "teks tautan")}
          >
            <Link2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Sisipkan gambar"
            onClick={() => applyToolbar("![", "](https://)", "alt gambar")}
          >
            <ImageIcon className="size-4" />
          </Button>
        </div>
        <textarea
          ref={textareaRef}
          id={`${formId}-content`}
          name="contentMarkdown"
          required
          minLength={20}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={16}
          className="w-full rounded-b-md border border-border bg-surface p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="Tulis artikelmu dengan Markdown..."
        />
      </div>

      <div>
        <p className="mb-2 font-mono text-[11px] text-muted uppercase tracking-[0.08em]">
          Pratinjau
        </p>
        <div className="min-h-24 rounded-md border border-border bg-surface p-4">
          {content.trim() ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-muted text-sm">
              Pratinjau akan muncul di sini saat Anda mulai menulis.
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Menyimpan..." : "Simpan Draf"}
      </Button>
    </form>
  );
}
