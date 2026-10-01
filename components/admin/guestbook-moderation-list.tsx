"use client";

import { BookOpen, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveGuestbookEntry,
  rejectGuestbookEntry,
} from "@/lib/actions/admin-interaksi-mutations";
import type { GuestbookEntry } from "@/lib/db/schema";

function GuestbookModerationItem({
  entry,
  onResolved,
}: {
  entry: GuestbookEntry;
  onResolved: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function resolve(action: (id: string) => Promise<{ error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action(entry.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      onResolved(entry.id);
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
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-sm">{entry.name}</p>
          <span className="shrink-0 rounded-full bg-muted/20 px-2 py-0.5 text-[10px] text-muted uppercase">
            {entry.context}
          </span>
        </div>
        <p className="mt-0.5 text-foreground/90 text-sm">{entry.message}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => resolve(approveGuestbookEntry, "Entri buku tamu disetujui.")}
          aria-label={`Setujui entri buku tamu dari ${entry.name}`}
        >
          <Check className="size-4" aria-hidden="true" />
          Setujui
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => resolve(rejectGuestbookEntry, "Entri buku tamu ditolak.")}
          aria-label={`Tolak entri buku tamu dari ${entry.name}`}
        >
          <X className="size-4" aria-hidden="true" />
          Tolak
        </Button>
      </div>
    </motion.div>
  );
}

export function GuestbookModerationList({ initialEntries }: { initialEntries: GuestbookEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);

  function handleResolved(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-surface/50 px-6 py-12 text-center">
        <BookOpen className="size-6 text-muted" aria-hidden="true" />
        <p className="text-muted text-sm">Tidak ada entri buku tamu menunggu moderasi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {entries.map((entry) => (
          <GuestbookModerationItem key={entry.id} entry={entry} onResolved={handleResolved} />
        ))}
      </AnimatePresence>
    </div>
  );
}
