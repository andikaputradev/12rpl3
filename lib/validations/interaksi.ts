import { z } from "zod";

export const guestbookEntrySchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter."),
  message: z
    .string()
    .trim()
    .min(5, "Pesan minimal 5 karakter.")
    .max(500, "Pesan maksimal 500 karakter."),
});

export type GuestbookEntryFormInput = z.infer<typeof guestbookEntrySchema>;

export const aspirationSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "Aspirasi minimal 10 karakter.")
    .max(1000, "Aspirasi maksimal 1000 karakter."),
  isAnonymous: z.boolean(),
});

export type AspirationFormInput = z.infer<typeof aspirationSchema>;

export const voteSchema = z.object({
  pollId: z.uuid("Polling tidak valid."),
  optionIds: z
    .array(z.uuid("Opsi tidak valid."))
    .min(1, "Pilih minimal satu opsi.")
    .max(20, "Maksimal 20 opsi dapat dipilih."),
});

export type VoteFormInput = z.infer<typeof voteSchema>;

export const pollOptionInputSchema = z
  .string()
  .trim()
  .min(1, "Label opsi minimal 1 karakter.")
  .max(120, "Label opsi maksimal 120 karakter.");

export const pollSchema = z.object({
  question: z
    .string()
    .trim()
    .min(5, "Pertanyaan minimal 5 karakter.")
    .max(300, "Pertanyaan maksimal 300 karakter."),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter.").optional(),
  allowMultipleChoice: z.boolean(),
  showResultsBeforeClose: z.boolean(),
  closesAt: z.string().optional().or(z.literal("")),
  options: z.array(pollOptionInputSchema).min(2, "Minimal 2 opsi.").max(10, "Maksimal 10 opsi."),
});

export type PollFormInput = z.infer<typeof pollSchema>;
