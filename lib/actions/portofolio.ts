import "server-only";
import { desc, eq } from "drizzle-orm";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { portfolioProjects } from "@/lib/db/schema";

export async function getMyPortfolioProjects() {
  const { userId } = await requireAuthenticatedUser();
  return db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.submittedBy, userId))
    .orderBy(desc(portfolioProjects.createdAt));
}
