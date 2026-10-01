import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/lib/db/schema";

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; variant: "outline" | "success" | "destructive" }
> = {
  draft: { label: "Draf", variant: "outline" },
  pending_review: { label: "Menunggu", variant: "outline" },
  approved: { label: "Disetujui", variant: "success" },
  published: { label: "Diterbitkan", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  archived: { label: "Diarsipkan", variant: "outline" },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
