import { z } from "zod";

export const pesanKesanSchema = z.object({
  toStudentId: z.uuid("Penerima tidak valid."),
  message: z
    .string()
    .trim()
    .min(10, "Pesan minimal 10 karakter.")
    .max(1000, "Pesan maksimal 1000 karakter."),
  isAnonymous: z.boolean(),
});

export type PesanKesanFormInput = z.infer<typeof pesanKesanSchema>;

export const kelulusanContentSchema = z.object({
  introText: z.string().trim().max(2000, "Teks pengantar maksimal 2000 karakter.").optional(),
  compilationVideoUrl: z
    .string()
    .trim()
    .max(500, "Tautan video maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type KelulusanContentFormInput = z.infer<typeof kelulusanContentSchema>;
