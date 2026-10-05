import { z } from "zod";
import { eventCategoryEnum } from "@/lib/db/schema";

export const classProfileSchema = z.object({
  motto: z
    .string()
    .trim()
    .min(10, "Motto minimal 10 karakter.")
    .max(200, "Motto maksimal 200 karakter."),
  sejarah: z.string().trim().min(50, "Sejarah minimal 50 karakter."),
  visi: z
    .string()
    .trim()
    .min(10, "Visi minimal 10 karakter.")
    .max(500, "Visi maksimal 500 karakter."),
  misi: z
    .array(z.string().trim().min(3, "Setiap poin misi minimal 3 karakter."))
    .min(1, "Minimal satu poin misi.")
    .max(15, "Maksimal 15 poin misi."),
  tahunAjaran: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran: 2026/2027."),
});

export type ClassProfileFormInput = z.infer<typeof classProfileSchema>;

export const highlightSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(100, "Judul maksimal 100 karakter."),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter.")
    .max(120, "Deskripsi maksimal 120 karakter."),
  imageUrl: z.url("URL gambar tidak valid."),
  linkHref: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || v.startsWith("http"), {
      message: "Tautan harus path relatif atau URL lengkap.",
    })
    .optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type HighlightFormInput = z.infer<typeof highlightSchema>;

export const eventCategoryValues = eventCategoryEnum.enumValues;

export const academicEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),
  eventDate: z.iso.datetime({ offset: true }).or(
    z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Tanggal tidak valid.",
    }),
  ),
  description: z.string().trim().max(500).optional(),
  // Fase 3 - field baru, aditif. Default "lainnya" konsisten dengan default
  // kolom database untuk baris Fase 1 yang sudah ada sebelum migration ini.
  category: z.enum(eventCategoryValues).default("lainnya"),
  isFeaturedCountdown: z.boolean().default(false),
});

export type AcademicEventFormInput = z.infer<typeof academicEventSchema>;

export const waliKelasContactSchema = z.object({
  publicContact: z
    .string()
    .trim()
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
      "Format nomor WhatsApp tidak valid (contoh: 081234567890).",
    )
    .optional()
    .or(z.literal("")),
});
