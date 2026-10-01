import type { AssessmentType } from "@/lib/db/schema";

export type SubjectScores = Partial<Record<AssessmentType, number>>;

/**
 * Rata-rata sederhana antar jenis penilaian yang tersedia, tanpa pembobotan
 * (Asumsi Kunci #5, prompt Fase 3). Jenis penilaian yang belum dinilai tidak
 * dihitung sebagai 0 — hanya nilai yang benar-benar ada yang masuk rata-rata.
 * Jika sekolah kelak memakai skema pembobotan resmi, ganti isi fungsi ini
 * saja; seluruh pemanggil (Server Action, komponen tabel) tidak perlu diubah.
 */
export function calculateSubjectAverage(scores: SubjectScores): number | null {
  const values = Object.values(scores).filter((value): value is number => value !== undefined);
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function hasAnyScore(scores: SubjectScores): boolean {
  return Object.values(scores).some((value) => value !== undefined);
}
