import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GradeRow } from "@/lib/actions/akademik";
import type { AssessmentType } from "@/lib/db/schema";

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  praktik: "Praktik",
};
const ASSESSMENT_ORDER: AssessmentType[] = ["tugas", "uts", "uas", "praktik"];

export function GradesTable({ rows }: { rows: GradeRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-border border-dashed py-10 text-center text-muted text-sm">
        Belum ada nilai tercatat untuk semester ini.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Mata Pelajaran</TableHead>
          {ASSESSMENT_ORDER.map((type) => (
            <TableHead key={type} scope="col" className="text-center">
              {ASSESSMENT_LABELS[type]}
            </TableHead>
          ))}
          <TableHead scope="col" className="text-center">
            Rata-rata
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.subjectId}-${row.semester}`}>
            <TableCell className="font-medium">{row.subjectName}</TableCell>
            {ASSESSMENT_ORDER.map((type) => (
              <TableCell key={type} className="text-center tabular-nums">
                {row.scores[type] ?? (
                  <span className="text-muted">
                    <span className="sr-only">Belum dinilai</span>
                    <span aria-hidden="true">-</span>
                  </span>
                )}
              </TableCell>
            ))}
            <TableCell className="text-center font-semibold tabular-nums">
              {row.average ?? (
                <span className="font-normal text-muted">
                  <span className="sr-only">Belum ada nilai</span>
                  <span aria-hidden="true">-</span>
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
