"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { upsertPiketAssignment } from "@/lib/actions/admin-jadwal";
import type { PiketDay } from "@/lib/actions/jadwal";
import type { DayOfWeek } from "@/lib/db/schema";

const DAY_LABELS: Record<DayOfWeek, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};
const DAYS: DayOfWeek[] = ["senin", "selasa", "rabu", "kamis", "jumat"];

export function PiketManager({
  piketDays,
  students,
}: {
  piketDays: PiketDay[];
  students: { id: string; fullName: string }[];
}) {
  const [selections, setSelections] = useState<Record<DayOfWeek, Set<string>>>(() => {
    const initial = {} as Record<DayOfWeek, Set<string>>;
    for (const day of DAYS) {
      const match = piketDays.find((entry) => entry.dayOfWeek === day);
      initial[day] = new Set(match?.students.map((student) => student.id) ?? []);
    }
    return initial;
  });
  const [savingDay, setSavingDay] = useState<DayOfWeek | null>(null);
  const [, startTransition] = useTransition();

  function toggleStudent(day: DayOfWeek, studentId: string) {
    setSelections((prev) => {
      const next = new Set(prev[day]);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return { ...prev, [day]: next };
    });
  }

  function handleSave(day: DayOfWeek) {
    setSavingDay(day);
    startTransition(async () => {
      const result = await upsertPiketAssignment(day, [...selections[day]]);
      setSavingDay(null);
      if (result.error) toast.error(result.error);
      else toast.success(`Piket ${DAY_LABELS[day]} tersimpan.`);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {DAYS.map((day) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle className="text-base">{DAY_LABELS[day]}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
              {students.length === 0 ? (
                <p className="text-muted text-sm">Belum ada data siswa.</p>
              ) : (
                students.map((student) => {
                  const checkboxId = `piket-${day}-${student.id}`;
                  return (
                    <div key={student.id} className="flex items-center gap-2">
                      <Checkbox
                        id={checkboxId}
                        checked={selections[day].has(student.id)}
                        onCheckedChange={() => toggleStudent(day, student.id)}
                      />
                      <Label htmlFor={checkboxId} className="cursor-pointer font-normal text-sm">
                        {student.fullName}
                      </Label>
                    </div>
                  );
                })
              )}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSave(day)}
              disabled={savingDay === day}
            >
              {savingDay === day ? "Menyimpan..." : "Simpan"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
