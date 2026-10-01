import { z } from "zod";

const optionalUrl = z.literal("").or(z.url("URL tidak valid."));

export const portfolioSubmitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter.")
    .max(2000, "Deskripsi maksimal 2000 karakter."),
  techStack: z.array(z.string().trim().min(1).max(30)).max(20, "Maksimal 20 item tech stack."),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  contributorIds: z.array(z.uuid()).max(10, "Maksimal 10 kontributor tambahan."),
});

export type PortfolioSubmitInput = z.infer<typeof portfolioSubmitSchema>;

/** Input mentah "tech stack dipisah koma" dari textarea, diparsing ke array bersih. */
export function parseTechStackInput(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 20);
}
