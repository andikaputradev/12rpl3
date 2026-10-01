import { z } from "zod";

// instagram/tiktok menerima handle polos ("@nama"/"nama") ATAU URL penuh:
// lihat normalizeHandleUrl di components/direktori/social-links.tsx, yang
// sudah menangani kedua bentuk saat merender. Validasi di sini sengaja
// longgar (bukan z.url()) agar tidak menolak handle polos yang sah.
const socialHandleSchema = z
  .string()
  .trim()
  .max(50, "Maksimal 50 karakter.")
  .optional()
  .or(z.literal(""));

export const updateMyProfileSchema = z.object({
  bio: z.string().trim().max(500, "Bio maksimal 500 karakter.").optional().or(z.literal("")),
  citaCita: z
    .string()
    .trim()
    .max(150, "Cita-cita maksimal 150 karakter.")
    .optional()
    .or(z.literal("")),
  instagram: socialHandleSchema,
  tiktok: socialHandleSchema,
  yearbookQuote: z
    .string()
    .trim()
    .max(280, "Kutipan yearbook maksimal 280 karakter.")
    .optional()
    .or(z.literal("")),
});

export type UpdateMyProfileFormInput = z.infer<typeof updateMyProfileSchema>;
