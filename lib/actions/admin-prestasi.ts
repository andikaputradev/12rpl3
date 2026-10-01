import "server-only";
import { asc, eq } from "drizzle-orm";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { portfolioProjects, profiles } from "@/lib/db/schema";

export async function getPendingPortfolio() {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  return db
    .select({
      id: portfolioProjects.id,
      title: portfolioProjects.title,
      description: portfolioProjects.description,
      techStack: portfolioProjects.techStack,
      projectUrl: portfolioProjects.projectUrl,
      repoUrl: portfolioProjects.repoUrl,
      thumbnailUrl: portfolioProjects.thumbnailUrl,
      submitterName: profiles.fullName,
      createdAt: portfolioProjects.createdAt,
    })
    .from(portfolioProjects)
    .innerJoin(profiles, eq(portfolioProjects.submittedBy, profiles.id))
    .where(eq(portfolioProjects.status, "pending_review"))
    .orderBy(asc(portfolioProjects.createdAt));
}
