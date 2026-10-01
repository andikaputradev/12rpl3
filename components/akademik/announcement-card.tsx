import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Announcement } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card className={cn(announcement.isPinned && "border-accent/40 bg-accent/6")}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{announcement.title}</CardTitle>
        {announcement.isPinned ? (
          <Badge className="shrink-0">
            <Pin className="size-3" aria-hidden="true" /> Disematkan
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
        <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em]">
          {format(announcement.createdAt, "d MMMM yyyy, HH.mm", { locale: idLocale })}
        </p>
      </CardContent>
    </Card>
  );
}
