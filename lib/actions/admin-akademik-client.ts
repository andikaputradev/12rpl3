"use server";

import { getAttendanceEntrySheet, getGradeEntrySheet } from "@/lib/actions/admin-akademik";
import type { AssessmentType } from "@/lib/db/schema";

/** Jembatan client untuk BulkGradeEntryTable - lihat rasionalisasi identik di jadwal-client.ts. */
export async function fetchGradeEntrySheet(
  subjectId: string,
  assessmentType: AssessmentType,
  semester: string,
) {
  return getGradeEntrySheet(subjectId, assessmentType, semester);
}

/** Jembatan client untuk BulkAttendanceEntryTable. */
export async function fetchAttendanceEntrySheet(date: string) {
  return getAttendanceEntrySheet(date);
}
