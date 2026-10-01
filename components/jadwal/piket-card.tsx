import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PiketDay } from "@/lib/actions/jadwal";
import type { DayOfWeek } from "@/lib/db/schema";

const DAY_LABELS: Record<DayOfWeek, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};

export function PiketCard({ day }: { day: PiketDay }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{DAY_LABELS[day.dayOfWeek]}</CardTitle>
      </CardHeader>
      <CardContent>
        {day.students.length === 0 ? (
          <p className="text-muted text-sm">Belum ada petugas piket.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {day.students.map((student) => (
              <li key={student.id}>{student.fullName}</li>
            ))}
          </ul>
        )}
        {day.note ? <p className="mt-3 text-muted text-xs italic">{day.note}</p> : null}
      </CardContent>
    </Card>
  );
}
