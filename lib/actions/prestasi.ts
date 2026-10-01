import "server-only";
import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  type AchievementLevel,
  achievementParticipants,
  achievements,
  alumniTestimonials,
  portfolioContributors,
  portfolioProjects,
  profiles,
} from "@/lib/db/schema";

export interface AchievementWithParticipants {
  id: string;
  title: string;
  description: string | null;
  level: AchievementLevel;
  eventDate: Date | null;
  certificateUrl: string | null;
  participantNames: string[];
  hiddenParticipantCount: number;
  /** true jika baris achievement_participants kosong — prestasi tingkat kelas, bukan individu. */
  isClassLevel: boolean;
}

/**
 * Nama siswa dengan isPublic=false DISARING DI SINI, di server — tidak
 * pernah dikirim ke client sama sekali (Asumsi Kunci #6 brief), bukan hanya
 * disembunyikan di UI. Prestasinya sendiri tetap tercatat dan tampil.
 */
export const getAchievements = cache(
  unstable_cache(
    async (): Promise<AchievementWithParticipants[]> => {
      try {
        const [achievementRows, participantRows] = await Promise.all([
          db.select().from(achievements).orderBy(desc(achievements.eventDate)),
          db
            .select({
              achievementId: achievementParticipants.achievementId,
              fullName: profiles.fullName,
              isPublic: profiles.isPublic,
            })
            .from(achievementParticipants)
            .innerJoin(profiles, eq(achievementParticipants.studentId, profiles.id)),
        ]);

        return achievementRows.map((achievement) => {
          const participants = participantRows.filter((p) => p.achievementId === achievement.id);
          const visibleNames = participants.filter((p) => p.isPublic).map((p) => p.fullName);
          return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            level: achievement.level,
            eventDate: achievement.eventDate,
            certificateUrl: achievement.certificateUrl,
            participantNames: visibleNames,
            hiddenParticipantCount: participants.length - visibleNames.length,
            isClassLevel: participants.length === 0,
          };
        });
      } catch (error) {
        console.error("[getAchievements] Database error:", error);
        return [];
      }
    },
    ["public_achievements"],
    { tags: ["achievements"], revalidate: 3600 },
  ),
);

export interface PortfolioProjectView {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  projectUrl: string | null;
  repoUrl: string | null;
  thumbnailUrl: string | null;
  submitterName: string;
  contributorNames: string[];
}

const HIDDEN_NAME_LABEL = "Siswa (nama disembunyikan)";

export const getPortfolioProjects = cache(
  unstable_cache(
    async (): Promise<PortfolioProjectView[]> => {
      try {
        const [projects, contributorRows] = await Promise.all([
          db
            .select({
              id: portfolioProjects.id,
              title: portfolioProjects.title,
              description: portfolioProjects.description,
              techStack: portfolioProjects.techStack,
              projectUrl: portfolioProjects.projectUrl,
              repoUrl: portfolioProjects.repoUrl,
              thumbnailUrl: portfolioProjects.thumbnailUrl,
              submitterName: profiles.fullName,
              submitterIsPublic: profiles.isPublic,
            })
            .from(portfolioProjects)
            .innerJoin(profiles, eq(portfolioProjects.submittedBy, profiles.id))
            .where(eq(portfolioProjects.status, "approved"))
            .orderBy(desc(portfolioProjects.createdAt)),
          db
            .select({
              projectId: portfolioContributors.projectId,
              fullName: profiles.fullName,
              isPublic: profiles.isPublic,
            })
            .from(portfolioContributors)
            .innerJoin(profiles, eq(portfolioContributors.studentId, profiles.id)),
        ]);

        return projects.map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          techStack: project.techStack,
          projectUrl: project.projectUrl,
          repoUrl: project.repoUrl,
          thumbnailUrl: project.thumbnailUrl,
          submitterName: project.submitterIsPublic ? project.submitterName : HIDDEN_NAME_LABEL,
          contributorNames: contributorRows
            .filter((c) => c.projectId === project.id)
            .map((c) => (c.isPublic ? c.fullName : HIDDEN_NAME_LABEL)),
        }));
      } catch (error) {
        console.error("[getPortfolioProjects] Database error:", error);
        return [];
      }
    },
    ["public_portfolios"],
    { tags: ["portfolios"], revalidate: 3600 },
  ),
);

export interface TestimonialView {
  id: string;
  name: string;
  photoUrl: string | null;
  quote: string;
  contextNote: string | null;
}

export const getAlumniTestimonials = cache(
  unstable_cache(
    async (): Promise<TestimonialView[]> => {
      try {
        return await db
          .select({
            id: alumniTestimonials.id,
            name: alumniTestimonials.name,
            photoUrl: alumniTestimonials.photoUrl,
            quote: alumniTestimonials.quote,
            contextNote: alumniTestimonials.contextNote,
          })
          .from(alumniTestimonials)
          .orderBy(desc(alumniTestimonials.createdAt));
      } catch (error) {
        console.error("[getAlumniTestimonials] Database error:", error);
        return [];
      }
    },
    ["public_testimonials"],
    { tags: ["testimonials"], revalidate: 3600 },
  ),
);
