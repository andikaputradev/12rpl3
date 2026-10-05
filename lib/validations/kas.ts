import { z } from "zod";

// Nomor DANA adalah nomor ponsel Indonesia - pola identik dengan
// waliKelasContactSchema.publicContact di admin-profil.ts demi konsistensi
// format validasi nomor di seluruh aplikasi.
const DANA_NUMBER_PATTERN = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

export const kasSettingsSchema = z.object({
  danaNumber: z
    .string()
    .trim()
    .regex(DANA_NUMBER_PATTERN, "Format nomor DANA tidak valid (contoh: 081234567890).")
    .optional()
    .or(z.literal("")),
  danaAccountName: z
    .string()
    .trim()
    .max(100, "Nama akun maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  nominalInfo: z
    .string()
    .trim()
    .max(100, "Info nominal maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  instructions: z
    .string()
    .trim()
    .max(500, "Instruksi maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type KasSettingsFormInput = z.infer<typeof kasSettingsSchema>;
