import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogEntryView } from "@/lib/actions/admin-akademik";

function summarizeChange(before: unknown, after: unknown, tableName: string): string {
  if (tableName === "grades") {
    const b = before as { score?: number } | null;
    const a = after as { score?: number } | null;
    if (b && a) return `${b.score} \u2192 ${a.score}`;
    if (a) return `Nilai baru: ${a.score}`;
    return "—";
  }
  if (tableName === "attendance") {
    const b = before as { status?: string } | null;
    const a = after as { status?: string } | null;
    if (b && a) return `${b.status} \u2192 ${a.status}`;
    if (a) return `Status baru: ${a.status}`;
    return "—";
  }
  return "—";
}

export function AuditLogTable({ entries }: { entries: AuditLogEntryView[] }) {
  if (entries.length === 0) {
    return <p className="text-muted text-sm">Belum ada riwayat perubahan.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Waktu</TableHead>
          <TableHead scope="col">Diubah Oleh</TableHead>
          <TableHead scope="col">Tabel</TableHead>
          <TableHead scope="col">Siswa</TableHead>
          <TableHead scope="col">Aksi</TableHead>
          <TableHead scope="col">Perubahan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap font-mono text-muted text-xs">
              {format(entry.createdAt, "d MMM yyyy, HH:mm", { locale: idLocale })}
            </TableCell>
            <TableCell>{entry.actorName ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="outline">{entry.tableName === "grades" ? "Nilai" : "Absensi"}</Badge>
            </TableCell>
            <TableCell>{entry.studentName ?? "—"}</TableCell>
            <TableCell className="text-muted text-xs uppercase">{entry.action}</TableCell>
            <TableCell className="font-mono text-xs">
              {summarizeChange(entry.before, entry.after, entry.tableName)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
