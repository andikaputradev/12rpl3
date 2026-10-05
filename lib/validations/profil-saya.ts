import { z } from "zod";

// instagram/tiktok menerima handle polos ("@nama"/"nama") ATAU URL penuh:
// lihat normalizeHandleUrl di components/direktori/social-links.tsx, yang
// sudah menangani kedua bentuk saat merender. Validasi di sini sengaja
// longgar (bukan z.url()) agar tidak menolak handle polos yang sah.
const socialHandleSchema = z
  .string()
  .trim()
  .max(100, "Maksimal 100 karakter.")
  .optional()
  .or(z.literal(""));

export const updateMyProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(500, "Bio maksimal 500 karakter.").optional().or(z.literal("")),
  citaCita: z
    .string()
    .trim()
    .max(150, "Cita-cita maksimal 150 karakter.")
    .optional()
    .or(z.literal("")),
  yearbookQuote: z
    .string()
    .trim()
    .max(280, "Kutipan yearbook maksimal 280 karakter.")
    .optional()
    .or(z.literal("")),
  instagram: socialHandleSchema,
  tiktok: socialHandleSchema,
  github: socialHandleSchema,
  linkedin: socialHandleSchema,
  website: socialHandleSchema,
  publicContact: z
    .string()
    .trim()
    .max(100, "Kontak maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  syncYearbook: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true" || val === "on"),
});

export type UpdateMyProfileFormInput = z.infer<typeof updateMyProfileSchema>;
