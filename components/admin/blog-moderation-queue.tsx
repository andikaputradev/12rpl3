"use client";

import { Check, FileText, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approvePost, rejectPost } from "@/lib/actions/admin-blog-mutations";

interface PendingPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  authorName: string;
}

function BlogModerationItem({
  post,
  onResolved,
}: {
  post: PendingPost;
  onResolved: (id: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formId = useId();

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePost(post.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Artikel diterbitkan.");
      onResolved(post.id);
    });
  }

  function handleReject() {
    if (reason.trim().length < 5) {
      setReasonError("Alasan penolakan minimal 5 karakter.");
      return;
    }
    startTransition(async () => {
      const result = await rejectPost(post.id, reason);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Artikel ditolak.");
      setRejectOpen(false);
      onResolved(post.id);
    });
  }

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-surface px-4 py-3"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background text-muted">
        <FileText className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{post.title}</p>
        <p className="truncate text-muted text-xs">Oleh {post.authorName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="ghost" size="sm" asChild>
          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
            Pratinjau
          </a>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleApprove}
          aria-label={`Terbitkan artikel ${post.title}`}
        >
          <Check className="size-4" />
          Terbitkan
        </Button>
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => setRejectOpen(true)}
            aria-label={`Tolak artikel ${post.title}`}
          >
            <X className="size-4" />
            Tolak
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Artikel</DialogTitle>
              <DialogDescription>
                Alasan penolakan akan ditampilkan kepada penulis di halaman "Tulisan Saya".
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-reason`}>Alasan Penolakan</Label>
              <Textarea
                id={`${formId}-reason`}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError(null);
                }}
                rows={3}
                minLength={5}
                maxLength={500}
                aria-invalid={Boolean(reasonError)}
              />
              {reasonError ? <p className="text-destructive-text text-xs">{reasonError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={handleReject}
              >
                Tolak Artikel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}

export function BlogModerationQueue({ initialPosts }: { initialPosts: PendingPost[] }) {
  const [posts, setPosts] = useState(initialPosts);

  function handleResolved(id: string) {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-surface/50 px-6 py-16 text-center">
        <FileText className="size-6 text-muted" aria-hidden="true" />
        <p className="text-muted text-sm">Tidak ada artikel menunggu tinjauan saat ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {posts.map((post) => (
          <BlogModerationItem key={post.id} post={post} onResolved={handleResolved} />
        ))}
      </AnimatePresence>
    </div>
  );
}
