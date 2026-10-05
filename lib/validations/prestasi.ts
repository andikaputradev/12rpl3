import { z } from "zod";
import { achievementLevelEnum } from "@/lib/db/schema";

export const achievementLevelValues = achievementLevelEnum.enumValues;

export const achievementSchema = z.object({
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
  level: z.enum(achievementLevelValues),
  eventDate: z.string().optional().or(z.literal("")),
  // Kosong berarti prestasi tingkat kelas, bukan individu - lihat komentar
  // achievementParticipants di lib/db/schema.ts.
  participantIds: z.array(z.uuid()).max(40, "Maksimal 40 peserta."),
});

export type AchievementFormInput = z.infer<typeof achievementSchema>;

export const testimonialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  quote: z
    .string()
    .trim()
    .min(10, "Kutipan minimal 10 karakter.")
    .max(1000, "Kutipan maksimal 1000 karakter."),
  contextNote: z
    .string()
    .trim()
    .max(200, "Catatan konteks maksimal 200 karakter.")
    .optional()
    .or(z.literal("")),
});

export type TestimonialFormInput = z.infer<typeof testimonialSchema>;

export const moderationRejectionSchema = z
  .string()
  .trim()
  .min(5, "Alasan penolakan minimal 5 karakter.")
  .max(500, "Alasan penolakan maksimal 500 karakter.");
