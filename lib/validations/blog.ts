import { z } from "zod";

export const blogPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),
  contentMarkdown: z.string().trim().min(20, "Isi artikel minimal 20 karakter."),
  excerpt: z
    .string()
    .trim()
    .max(300, "Ringkasan maksimal 300 karakter.")
    .optional()
    .or(z.literal("")),
  categoryId: z.uuid("Kategori tidak valid.").nullable(),
  tags: z.array(z.string().trim().min(1).max(24)).max(8, "Maksimal 8 tag."),
});

export type BlogPostFormInput = z.infer<typeof blogPostSchema>;

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, 8);
}

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Komentar minimal 2 karakter.")
    .max(1000, "Komentar maksimal 1000 karakter."),
});

export const blogCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(50, "Nama kategori maksimal 50 karakter."),
});

export type BlogCategoryFormInput = z.infer<typeof blogCategorySchema>;
