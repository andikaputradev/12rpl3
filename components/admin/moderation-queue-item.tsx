"use client";

import { Check, ImageIcon, X } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { YoutubeFacade } from "@/components/galeri/youtube-facade";
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
import type { GalleryItemWithContext } from "@/lib/actions/admin-galeri";
import { approveItem, rejectItem } from "@/lib/actions/admin-galeri";
import { cloudinaryOptimized } from "@/lib/utils";

export function ModerationQueueItem({
  item,
  onResolved,
}: {
  item: GalleryItemWithContext;
  onResolved: (id: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formId = useId();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveItem(item.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Kiriman disetujui.");
      onResolved(item.id);
    });
  }

  function handleReject() {
    if (reason.trim().length < 10) {
      setReasonError("Alasan penolakan minimal 10 karakter.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("reason", reason);
      const result = await rejectItem(item.id, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Kiriman ditolak.");
      setRejectOpen(false);
      onResolved(item.id);
    });
  }

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-surface px-4 py-3"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-background">
        {item.type === "image" ? (
          <Image
            src={cloudinaryOptimized(item.mediaUrl, "f_auto,q_auto,w_128,h_128,c_fill")}
            alt={item.caption ?? "Pratinjau kiriman"}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <YoutubeFacade
            videoId={item.mediaUrl}
            thumbnailUrl={item.thumbnailUrl}
            title={item.caption ?? "Video"}
            className="h-full w-full"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.albumTitle}</p>
        <p className="truncate text-xs text-muted">Oleh {item.uploaderName}</p>
        {item.caption ? <p className="truncate text-xs text-muted">"{item.caption}"</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleApprove}
          aria-label={`Setujui kiriman untuk album ${item.albumTitle}`}
        >
          <Check className="size-4" />
          Setujui
        </Button>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => setRejectOpen(true)}
            aria-label={`Tolak kiriman untuk album ${item.albumTitle}`}
          >
            <X className="size-4" />
            Tolak
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Kiriman</DialogTitle>
              <DialogDescription>
                Alasan penolakan akan ditampilkan kepada pengunggah di halaman "Kiriman Saya".
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-reason`}>Alasan Penolakan</Label>
              <Textarea
                id={`${formId}-reason`}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setReasonError(null);
                }}
                rows={3}
                minLength={10}
                maxLength={300}
                aria-invalid={Boolean(reasonError)}
              />
              {reasonError ? <p className="text-xs text-destructive-text">{reasonError}</p> : null}
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
                Tolak Kiriman
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}

export function ModerationEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <ImageIcon className="size-6 text-muted" aria-hidden="true" />
      <p className="text-sm text-muted">Tidak ada kiriman menunggu moderasi saat ini.</p>
    </div>
  );
}
