import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Format email tidak valid.")),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  redirectTo: z.string().startsWith("/").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter."),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi minimal 8 karakter."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
