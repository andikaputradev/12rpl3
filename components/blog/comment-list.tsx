"use client";

import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { EyeOff, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { hideComment } from "@/lib/actions/admin-blog-mutations";
import type { CommentView } from "@/lib/actions/blog";
import { deleteOwnComment } from "@/lib/actions/blog-mutations";
import { getInitials } from "@/lib/utils";

export function CommentList({
  comments,
  currentUserId,
  isStaff,
}: {
  comments: CommentView[];
  currentUserId: string | null;
  isStaff: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(comment: CommentView, isOwn: boolean) {
    startTransition(async () => {
      const result = isOwn ? await deleteOwnComment(comment.id) : await hideComment(comment.id);
      if (result.error) toast.error(result.error);
      else toast.success(isOwn ? "Komentar dihapus." : "Komentar disembunyikan.");
    });
  }

  if (comments.length === 0) {
    return <p className="text-muted text-sm">Belum ada komentar. Jadilah yang pertama.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => {
        const isOwn = comment.authorId === currentUserId;
        const canRemove = isOwn || isStaff;
        return (
          <li key={comment.id} className="flex gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs">{getInitials(comment.authorName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium text-sm">{comment.authorName}</p>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: idLocale })}
                </span>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
              {canRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="mt-1 h-auto gap-1 p-0 text-muted text-xs hover:text-destructive-text"
                  onClick={() => handleRemove(comment, isOwn)}
                >
                  {isOwn ? <Trash2 className="size-3" /> : <EyeOff className="size-3" />}
                  {isOwn ? "Hapus" : "Sembunyikan"}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
