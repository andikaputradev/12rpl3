import { UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AspirationDisplay } from "@/lib/actions/interaksi";
import { getInitials } from "@/lib/utils";

interface AspirationFeedProps {
  aspirations: AspirationDisplay[];
}

export function AspirationFeed({ aspirations }: AspirationFeedProps) {
  if (aspirations.length === 0) {
    return (
      <p className="rounded-lg border border-border border-dashed bg-surface/50 px-4 py-10 text-center text-muted text-sm">
        Belum ada aspirasi yang tayang.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {aspirations.map((aspiration) => (
        <Card key={aspiration.id}>
          <CardContent className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/20 text-muted">
              {aspiration.isAnonymous || !aspiration.authorName ? (
                <UserRound className="size-4" aria-hidden="true" />
              ) : (
                <span className="font-display text-accent-text text-xs">
                  {getInitials(aspiration.authorName)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium text-sm">
                  {aspiration.isAnonymous ? "Anonim" : aspiration.authorName}
                </p>
                <p className="shrink-0 font-mono text-[11px] text-muted">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                    new Date(aspiration.createdAt),
                  )}
                </p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-foreground/90 text-sm leading-relaxed">
                {aspiration.content}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
