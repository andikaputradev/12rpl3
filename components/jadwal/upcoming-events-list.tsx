import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_CATEGORY_COLOR_VAR, EVENT_CATEGORY_LABELS } from "@/lib/config/event-category";
import type { AcademicEvent } from "@/lib/db/schema";

export function UpcomingEventsList({ events }: { events: AcademicEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acara Mendatang</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted text-sm">Belum ada acara mendatang.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: EVENT_CATEGORY_COLOR_VAR[event.category] }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="font-mono text-[11px] text-muted uppercase tracking-[0.04em]">
                    {format(event.eventDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
                  </p>
                  <p className="text-muted text-xs">{EVENT_CATEGORY_LABELS[event.category]}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
