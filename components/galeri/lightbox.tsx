"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { YoutubeFacade } from "@/components/galeri/youtube-facade";
import { StatusBadge } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { GalleryItem } from "@/lib/db/schema";
import { cloudinaryOptimized } from "@/lib/utils";

interface LightboxProps {
  items: GalleryItem[];
  selectedIndex: number | null;
  currentUserId: string | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

export function Lightbox({
  items,
  selectedIndex,
  currentUserId,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [direction, setDirection] = useState(1);
  const lastIndex = useRef(selectedIndex);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= items.length) return;
      setDirection(nextIndex > (lastIndex.current ?? 0) ? 1 : -1);
      lastIndex.current = nextIndex;
      onNavigate(nextIndex);
    },
    [items.length, onNavigate],
  );

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goTo((selectedIndex ?? 0) + 1);
      if (event.key === "ArrowLeft") goTo((selectedIndex ?? 0) - 1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goTo]);

  const item = selectedIndex !== null ? items[selectedIndex] : null;
  const isOwnPending = item?.status === "pending_review" && item.uploadedBy === currentUserId;

  return (
    <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl border-none bg-transparent p-0 shadow-none"
        showCloseButton
      >
        <DialogTitle className="sr-only">{item?.caption ?? "Pratinjau media galeri"}</DialogTitle>

        {item ? (
          <div className="relative flex flex-col gap-3">
            <motion.div
              layoutId={`gallery-item-${item.id}`}
              className="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
            >
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={item.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: EASE }}
                  className="absolute inset-0"
                >
                  {item.type === "image" ? (
                    <Image
                      src={cloudinaryOptimized(item.mediaUrl)}
                      alt={item.caption ?? "Foto kegiatan kelas"}
                      fill
                      sizes="90vw"
                      className="object-contain"
                    />
                  ) : (
                    <YoutubeFacade
                      videoId={item.mediaUrl}
                      thumbnailUrl={item.thumbnailUrl}
                      title={item.caption ?? "Video kegiatan kelas"}
                      className="h-full w-full"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {selectedIndex !== null && selectedIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(selectedIndex - 1)}
                  aria-label="Sebelumnya"
                  className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="size-5" />
                </button>
              ) : null}
              {selectedIndex !== null && selectedIndex < items.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(selectedIndex + 1)}
                  aria-label="Berikutnya"
                  className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="size-5" />
                </button>
              ) : null}
            </motion.div>

            <div className="flex items-center justify-between gap-3 px-1">
              {item.caption ? <p className="text-sm text-foreground">{item.caption}</p> : <span />}
              {isOwnPending ? <StatusBadge status="pending_review" /> : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
