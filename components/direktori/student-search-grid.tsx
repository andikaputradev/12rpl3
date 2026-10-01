"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import { StudentCard } from "@/components/direktori/student-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudentListItem } from "@/lib/actions/direktori";

export function StudentSearchGrid({ students }: { students: StudentListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return students;
    return students.filter((student) => {
      const nameMatch = student.fullName.toLowerCase().includes(normalized);
      const absenMatch = student.absenNumber != null && String(student.absenNumber) === normalized;
      return nameMatch || absenMatch;
    });
  }, [students, query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau nomor absen..."
          className="pl-10"
          aria-label="Cari siswa"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="text-sm text-muted">
            Tidak ditemukan siswa dengan nama tersebut. Coba kata kunci lain.
          </p>
          <Button variant="outline" size="sm" onClick={() => setQuery("")}>
            <X className="size-4" />
            Reset Pencarian
          </Button>
        </div>
      ) : (
        <LayoutGroup>
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {filtered.map((student) => (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <StudentCard student={student} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}
    </div>
  );
}
