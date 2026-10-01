import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { AchievementManager } from "@/components/admin/achievement-manager";
import { requireStaffRole } from "@/lib/actions/guard";
import { getAllStudents } from "@/lib/actions/jadwal";
import { db } from "@/lib/db";
import { achievements } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Prestasi — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPrestasiPage() {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  const [achievementRows, students] = await Promise.all([
    db
      .select({
        id: achievements.id,
        title: achievements.title,
        level: achievements.level,
        eventDate: achievements.eventDate,
      })
      .from(achievements)
      .orderBy(desc(achievements.createdAt)),
    getAllStudents(),
  ]);

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Prestasi
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Perubahan langsung tampil di halaman Prestasi & Portofolio publik.
        </p>
      </header>

      <AchievementManager achievements={achievementRows} students={students} />
    </div>
  );
}
