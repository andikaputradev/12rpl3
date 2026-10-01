import { z } from "zod";
import { dayOfWeekEnum } from "@/lib/db/schema";

export const dayOfWeekValues = dayOfWeekEnum.enumValues;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleEntrySchema = z
  .object({
    id: z.uuid().optional(),
    dayOfWeek: z.enum(dayOfWeekValues),
    periodNumber: z.coerce
      .number()
      .int("Jam ke- harus bilangan bulat.")
      .min(1, "Jam ke- minimal 1.")
      .max(20, "Jam ke- maksimal 20."),
    startTime: z.string().regex(TIME_PATTERN, "Format waktu mulai: HH:MM."),
    endTime: z.string().regex(TIME_PATTERN, "Format waktu selesai: HH:MM."),
    // Nullable, bukan wajib: sebagian jam (istirahat, upacara) sengaja tidak
    // punya mata pelajaran, konsisten dengan classSchedule.subjectId di
    // lib/db/schema.ts yang tidak diberi .notNull().
    subjectId: z.uuid("Mata pelajaran tidak valid.").nullable(),
    teacherName: z
      .string()
      .trim()
      .max(100, "Nama guru maksimal 100 karakter.")
      .optional()
      .or(z.literal("")),
    room: z.string().trim().max(50, "Ruang maksimal 50 karakter.").optional().or(z.literal("")),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Jam mulai harus lebih awal dari jam selesai.",
    path: ["endTime"],
  });

export type ScheduleEntryInput = z.infer<typeof scheduleEntrySchema>;

export const scheduleEntriesSchema = z
  .array(scheduleEntrySchema)
  .max(60, "Maksimal 60 entri jadwal (12 jam pelajaran x 5 hari).");

export const piketAssignmentInputSchema = z.object({
  dayOfWeek: z.enum(dayOfWeekValues),
  studentIds: z.array(z.uuid()).max(40, "Maksimal 40 siswa per hari piket."),
});

export type PiketAssignmentInput = z.infer<typeof piketAssignmentInputSchema>;
