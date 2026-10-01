"use client";

import { Check, MessageCircleHeart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PendingPesanKesan } from "@/lib/actions/admin-kelulusan";
import { approvePesanKesan, rejectPesanKesan } from "@/lib/actions/admin-kelulusan-mutations";

function PesanKesanModerationItem({
  pesan,
  onResolved,
}: {
  pesan: PendingPesanKesan;
  onResolved: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function resolve(action: (id: string) => Promise<{ error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action(pesan.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      onResolved(pesan.id);
    });
  }

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 overflow-hidden rounded-lg border border-border bg-surface px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-muted text-xs">
          {pesan.fromName} → <span className="font-medium text-foreground">{pesan.toName}</span>
          {pesan.isAnonymous ? (
            <span className="ml-2 rounded-full bg-accent/12 px-2 py-0.5 text-[10px] text-accent-text uppercase">
              Anonim ke publik
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-foreground/90 text-sm">{pesan.message}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => resolve(approvePesanKesan, "Pesan-kesan disetujui.")}
          aria-label={`Setujui pesan-kesan dari ${pesan.fromName} untuk ${pesan.toName}`}
        >
          <Check className="size-4" aria-hidden="true" />
          Setujui
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => resolve(rejectPesanKesan, "Pesan-kesan ditolak.")}
          aria-label={`Tolak pesan-kesan dari ${pesan.fromName} untuk ${pesan.toName}`}
        >
          <X className="size-4" aria-hidden="true" />
          Tolak
        </Button>
      </div>
    </motion.div>
  );
}

export function PesanKesanModerationList({ initialItems }: { initialItems: PendingPesanKesan[] }) {
  const [items, setItems] = useState(initialItems);

  function handleResolved(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-surface/50 px-6 py-12 text-center">
        <MessageCircleHeart className="size-6 text-muted" aria-hidden="true" />
        <p className="text-muted text-sm">Tidak ada pesan-kesan menunggu moderasi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <PesanKesanModerationItem key={item.id} pesan={item} onResolved={handleResolved} />
        ))}
      </AnimatePresence>
    </div>
  );
}
