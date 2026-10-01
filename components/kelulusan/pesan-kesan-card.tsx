"use client";

import { Loader2, MessageCircleHeart } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PesanKesanDisplay } from "@/lib/actions/kelulusan";
import { fetchMorePesanKesan } from "@/lib/actions/kelulusan-client";

interface PesanKesanCardProps {
  initialItems: PesanKesanDisplay[];
  initialNextCursor: string | null;
}

export function PesanKesanCard({ initialItems, initialNextCursor }: PesanKesanCardProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!nextCursor) return;
    startTransition(async () => {
      const page = await fetchMorePesanKesan(nextCursor);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-border border-dashed bg-surface/50 px-4 py-10 text-center text-muted text-sm">
        Belum ada pesan-kesan yang tayang.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex gap-3">
            <MessageCircleHeart className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-muted text-xs">
                {item.fromName ?? "Anonim"} →{" "}
                <span className="font-medium text-foreground">{item.toName}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground/90 text-sm leading-relaxed">
                {item.message}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {nextCursor ? (
        <Button variant="outline" onClick={loadMore} disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Muat Lebih Banyak
        </Button>
      ) : null}
    </div>
  );
}
