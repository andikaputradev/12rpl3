import { z } from "zod";
import { assessmentTypeEnum, attendanceStatusEnum } from "@/lib/db/schema";

export const assessmentTypeValues = assessmentTypeEnum.enumValues;
export const attendanceStatusValues = attendanceStatusEnum.enumValues;

// Format eksplisit "Ganjil 2026/2027" / "Genap 2026/2027" - konsisten dengan
// contoh di komentar lib/db/schema.ts (grades.semester) dan tahunAjaran
// classProfile Fase 1.
const SEMESTER_PATTERN = /^(Ganjil|Genap) \d{4}\/\d{4}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const bulkGradeRowSchema = z.object({
  studentId: z.uuid(),
  // Sel kosong di UI (belum dinilai) TIDAK dikirim sebagai baris sama
  // sekali - bukan dikirim sebagai score: null - sehingga skema ini boleh
  // mewajibkan score berupa angka, konsisten dengan CHECK constraint
  // database (0-100).
  score: z.coerce
    .number("Nilai harus berupa angka.")
    .int("Nilai harus bilangan bulat.")
    .min(0, "Nilai minimal 0.")
    .max(100, "Nilai maksimal 100."),
});

export const bulkUpsertGradesSchema = z.object({
  subjectId: z.uuid("Mata pelajaran wajib dipilih."),
  assessmentType: z.enum(assessmentTypeValues),
  semester: z.string().trim().regex(SEMESTER_PATTERN, "Format semester: Ganjil 2026/2027."),
  rows: z
    .array(bulkGradeRowSchema)
    .min(1, "Minimal satu baris nilai untuk disimpan.")
    .max(100, "Maksimal 100 baris per penyimpanan."),
});

export type BulkUpsertGradesInput = z.infer<typeof bulkUpsertGradesSchema>;

export const attendanceRowSchema = z.object({
  studentId: z.uuid(),
  status: z.enum(attendanceStatusValues),
});

export const bulkUpsertAttendanceSchema = z.object({
  date: z.string().regex(DATE_PATTERN, "Format tanggal: YYYY-MM-DD."),
  rows: z
    .array(attendanceRowSchema)
    .min(1, "Minimal satu baris absensi untuk disimpan.")
    .max(100, "Maksimal 100 baris per penyimpanan."),
});

export type BulkUpsertAttendanceInput = z.infer<typeof bulkUpsertAttendanceSchema>;

export const assignmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter.")
    .optional()
    .or(z.literal("")),
  subjectId: z.uuid("Mata pelajaran tidak valid.").nullable(),
  dueDate: z.iso
    .datetime({ offset: true })
    .or(
      z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: "Tenggat tidak valid." }),
    ),
});

export type AssignmentFormInput = z.infer<typeof assignmentSchema>;

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),
  content: z
    .string()
    .trim()
    .min(10, "Isi pengumuman minimal 10 karakter.")
    .max(5000, "Isi pengumuman maksimal 5000 karakter."),
  isPinned: z.boolean().default(false),
});

export type AnnouncementFormInput = z.infer<typeof announcementSchema>;

export const submissionNotesSchema = z
  .string()
  .trim()
  .max(500, "Catatan maksimal 500 karakter.")
  .optional()
  .or(z.literal(""));
