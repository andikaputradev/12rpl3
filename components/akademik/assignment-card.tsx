import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { SubmissionUploadForm } from "@/components/akademik/submission-upload-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssignmentWithStatus } from "@/lib/actions/akademik";

const STATUS_CONFIG = {
  belum: { label: "Belum Dikumpulkan", variant: "outline" as const },
  terkumpul: { label: "Terkumpul", variant: "success" as const },
  terlambat: { label: "Terlambat", variant: "destructive" as const },
};

export function AssignmentCard({ assignment }: { assignment: AssignmentWithStatus }) {
  const statusConfig = STATUS_CONFIG[assignment.status];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base">{assignment.title}</CardTitle>
          <p className="mt-1 text-muted text-xs">
            {assignment.subjectName ?? "Umum"} · Tenggat{" "}
            {format(assignment.dueDate, "EEEE, d MMMM yyyy 'pukul' HH.mm", { locale: idLocale })}
          </p>
        </div>
        <Badge variant={statusConfig.variant} className="shrink-0">
          {statusConfig.label}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {assignment.description ? <p className="text-sm">{assignment.description}</p> : null}
        <SubmissionUploadForm
          assignmentId={assignment.id}
          existingFileUrl={assignment.fileUrl}
          existingNotes={assignment.notes}
        />
      </CardContent>
    </Card>
  );
}
