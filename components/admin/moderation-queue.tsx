"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  ModerationEmptyState,
  ModerationQueueItem,
} from "@/components/admin/moderation-queue-item";
import type { GalleryItemWithContext } from "@/lib/actions/admin-galeri";

export function ModerationQueue({ initialItems }: { initialItems: GalleryItemWithContext[] }) {
  const [items, setItems] = useState(initialItems);

  function handleResolved(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (items.length === 0) return <ModerationEmptyState />;

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <ModerationQueueItem key={item.id} item={item} onResolved={handleResolved} />
        ))}
      </AnimatePresence>
    </div>
  );
}
