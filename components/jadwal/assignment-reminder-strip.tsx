import { differenceInHours } from "date-fns";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getUpcomingAssignments } from "@/lib/actions/akademik";

function formatDueIn(dueDate: Date): string {
  const hours = differenceInHours(dueDate, new Date());
  if (hours < 1) return "Segera tenggat";
  if (hours < 24) return `${hours} jam lagi`;
  const days = Math.round(hours / 24);
  return `${days} hari lagi`;
}

/**
 * Server Component async - mengecek sesi lewat kegagalan
 * getUpcomingAssignments (yang menuntut requireAuthenticatedUser di
 * dalamnya) dan menyembunyikan diri bersih via try/catch, BUKAN memicu error
 * boundary halaman /jadwal yang publik. Ini persis perilaku "dilewati tanpa
 * error" yang disyaratkan Bagian 5 brief.
 */
export async function AssignmentReminderStrip() {
  let assignments: Awaited<ReturnType<typeof getUpcomingAssignments>>;
  try {
    assignments = await getUpcomingAssignments(7);
  } catch {
    return null;
  }

  if (assignments.length === 0) return null;

  return (
    <div className="rounded-lg border border-accent/25 bg-accent/8 p-4">
      <p className="flex items-center gap-1.5 font-mono text-[11px] text-accent-text uppercase tracking-[0.08em]">
        <Clock className="size-3.5" aria-hidden="true" />
        Tugas segera tenggat
      </p>
      <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <Link
              href="/akademik/tugas"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-accent"
            >
              <span className="font-medium">{assignment.title}</span>
              {assignment.subjectName ? (
                <span className="text-muted text-xs">{assignment.subjectName}</span>
              ) : null}
              <Badge variant="outline">{formatDueIn(assignment.dueDate)}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
