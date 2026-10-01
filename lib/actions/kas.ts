import "server-only";
import { eq } from "drizzle-orm";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { type KasSettings, kasSettings } from "@/lib/db/schema";

export async function getKasSettings(): Promise<KasSettings | null> {
  await requireAuthenticatedUser();
  const [row] = await db.select().from(kasSettings).where(eq(kasSettings.id, 1)).limit(1);
  return row ?? null;
}
