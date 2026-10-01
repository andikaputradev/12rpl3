import { Eye } from "lucide-react";

export function VisitorBadge({ count }: { count: number }) {
  const formatted = new Intl.NumberFormat("id-ID", {
    notation: count > 999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 font-mono text-[11px] text-muted backdrop-blur-sm">
      <Eye className="size-3" aria-hidden="true" />
      <span>{formatted} kunjungan</span>
    </div>
  );
}
