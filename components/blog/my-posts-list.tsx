"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { submitPostForReview } from "@/lib/actions/blog-mutations";
import type { ContentStatus } from "@/lib/db/schema";

interface MyPost {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  rejectionReason: string | null;
  createdAt: Date;
}

/** isStaff menentukan label tombol - keduanya memanggil submitPostForReview yang sama; status akhir ditentukan di server, bukan dari label yang ditampilkan (Bagian 6 brief). */
export function MyPostsList({ posts, isStaff }: { posts: MyPost[]; isStaff: boolean }) {
  const [items, setItems] = useState(posts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSubmitForReview(post: MyPost) {
    setPendingId(post.id);
    startTransition(async () => {
      const result = await submitPostForReview(post.id);
      setPendingId(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.status === "published" ? "Artikel diterbitkan." : "Artikel dikirim untuk ditinjau.",
      );
      setItems((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status: result.status ?? item.status,
                rejectionReason: null,
              }
            : item,
        ),
      );
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-border border-dashed py-12 text-center text-muted text-sm">
        Belum ada tulisan. Mulai menulis di{" "}
        <Link
          href="/blog/tulis"
          prefetch={false}
          className="text-accent-text underline underline-offset-2"
        >
          halaman tulis artikel
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((post) => {
        const canSubmit = post.status === "draft" || post.status === "rejected";
        return (
          <li
            key={post.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-sm">{post.title}</p>
                <StatusBadge status={post.status} />
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-muted uppercase tracking-[0.04em]">
                {format(post.createdAt, "d MMM yyyy", { locale: idLocale })}
              </p>
              {post.status === "rejected" && post.rejectionReason ? (
                <p className="mt-1 text-destructive-text text-xs">Alasan: {post.rejectionReason}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {post.status === "published" ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/blog/${post.slug}`} prefetch={false}>
                    Lihat
                  </Link>
                </Button>
              ) : null}
              {canSubmit ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pendingId === post.id}
                  onClick={() => handleSubmitForReview(post)}
                >
                  {pendingId === post.id
                    ? "Memproses..."
                    : isStaff
                      ? "Publikasikan"
                      : "Kirim untuk Ditinjau"}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
