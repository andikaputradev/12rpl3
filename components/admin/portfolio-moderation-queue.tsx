"use client";

import { Check, FolderKanban, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
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
import { approvePortfolio, rejectPortfolio } from "@/lib/actions/admin-prestasi-mutations";
import { cloudinaryOptimized } from "@/lib/utils";

interface PendingPortfolioItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  submitterName: string;
}

function PortfolioModerationItem({
  item,
  onResolved,
}: {
  item: PendingPortfolioItem;
  onResolved: (id: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formId = useId();

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePortfolio(item.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Proyek disetujui.");
      onResolved(item.id);
    });
  }

  function handleReject() {
    if (reason.trim().length < 5) {
      setReasonError("Alasan penolakan minimal 5 karakter.");
      return;
    }
    startTransition(async () => {
      const result = await rejectPortfolio(item.id, reason);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Proyek ditolak.");
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
        {item.thumbnailUrl ? (
          <Image
            src={cloudinaryOptimized(item.thumbnailUrl, "f_auto,q_auto,w_128,h_128,c_fill")}
            alt={item.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <FolderKanban className="size-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{item.title}</p>
        <p className="truncate text-muted text-xs">Oleh {item.submitterName}</p>
        <p className="truncate text-muted text-xs">{item.description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleApprove}
          aria-label={`Setujui proyek ${item.title}`}
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
            aria-label={`Tolak proyek ${item.title}`}
          >
            <X className="size-4" />
            Tolak
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Proyek</DialogTitle>
              <DialogDescription>
                Alasan penolakan akan ditampilkan kepada siswa di halaman portofolionya.
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
                Tolak Proyek
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}

export function PortfolioModerationQueue({
  initialItems,
}: {
  initialItems: PendingPortfolioItem[];
}) {
  const [items, setItems] = useState(initialItems);

  function handleResolved(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-surface/50 px-6 py-16 text-center">
        <FolderKanban className="size-6 text-muted" aria-hidden="true" />
        <p className="text-muted text-sm">Tidak ada proyek menunggu moderasi saat ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <PortfolioModerationItem key={item.id} item={item} onResolved={handleResolved} />
        ))}
      </AnimatePresence>
    </div>
  );
}
