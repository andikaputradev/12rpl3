import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/lib/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = `${siteConfig.className} - ${siteConfig.schoolName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

export default async function OpengraphImage() {
  const fileBuffer = await readFile(join(process.cwd(), "public/img/og-image.jpg"));
  return new Response(fileBuffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
