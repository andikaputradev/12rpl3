import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Format email tidak valid.")),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  redirectTo: z.string().startsWith("/").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
