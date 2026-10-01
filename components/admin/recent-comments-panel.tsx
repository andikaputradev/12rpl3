"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { EyeOff, MessageSquare } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { hideComment } from "@/lib/actions/admin-blog-mutations";

interface RecentComment {
  id: string;
  content: string;
  isHidden: boolean;
  createdAt: Date;
  authorName: string;
  postTitle: string;
  postSlug: string;
}

export function RecentCommentsPanel({ comments }: { comments: RecentComment[] }) {
  const [items, setItems] = useState(comments);
  const [isPending, startTransition] = useTransition();

  function handleHide(id: string) {
    startTransition(async () => {
      const result = await hideComment(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isHidden: true } : item)));
      toast.success("Komentar disembunyikan.");
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-surface/50 px-6 py-12 text-center">
        <MessageSquare className="size-6 text-muted" aria-hidden="true" />
        <p className="text-muted text-sm">Belum ada komentar.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((comment) => (
        <li
          key={comment.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm">{comment.content}</p>
            <p className="mt-1 text-muted text-xs">
              {comment.authorName} · pada "{comment.postTitle}" ·{" "}
              {format(comment.createdAt, "d MMM yyyy, HH:mm", { locale: idLocale })}
              {comment.isHidden ? " · disembunyikan" : ""}
            </p>
          </div>
          {!comment.isHidden ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => handleHide(comment.id)}
              aria-label={`Sembunyikan komentar dari ${comment.authorName}`}
              className="shrink-0"
            >
              <EyeOff className="size-3.5" /> Sembunyikan
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
