import { z } from "zod";

export const galleryCategories = [
  "kegiatan_belajar",
  "study_tour",
  "prakerin",
  "class_meeting",
  "perayaan",
  "lomba",
] as const;

export const galleryCategoryLabels: Record<(typeof galleryCategories)[number], string> = {
  kegiatan_belajar: "Kegiatan Belajar",
  study_tour: "Study Tour",
  prakerin: "Prakerin",
  class_meeting: "Class Meeting",
  perayaan: "Perayaan",
  lomba: "Lomba",
};

export const albumSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(120, "Judul maksimal 120 karakter."),
  category: z.enum(galleryCategories),
  eventDate: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), { message: "Tanggal tidak valid." })
    .optional(),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter.").optional(),
});

export type AlbumFormInput = z.infer<typeof albumSchema>;

export const uploadImageItemSchema = z.object({
  albumId: z.uuid("Album tidak valid."),
  type: z.literal("image"),
  caption: z.string().trim().max(280, "Caption maksimal 280 karakter.").optional(),
});

export const uploadVideoItemSchema = z.object({
  albumId: z.uuid("Album tidak valid."),
  type: z.literal("video"),
  youtubeUrl: z.url("Tautan YouTube tidak valid."),
  caption: z.string().trim().max(280, "Caption maksimal 280 karakter.").optional(),
});

export const uploadItemSchema = z.discriminatedUnion("type", [
  uploadImageItemSchema,
  uploadVideoItemSchema,
]);

export type UploadItemInput = z.infer<typeof uploadItemSchema>;

export const rejectReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Alasan penolakan minimal 10 karakter.")
    .max(300, "Alasan penolakan maksimal 300 karakter."),
});
