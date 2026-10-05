import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { AlumniManager } from "@/components/admin/alumni-manager";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { alumniTestimonials } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Alumni - Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAlumniPage() {
  await requireStaffRole(["super_admin", "wali_kelas", "pengurus"]);

  const testimonials = await db
    .select({
      id: alumniTestimonials.id,
      name: alumniTestimonials.name,
      quote: alumniTestimonials.quote,
    })
    .from(alumniTestimonials)
    .orderBy(desc(alumniTestimonials.createdAt));

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Kelola Testimoni Alumni
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Testimoni bersifat kelola-staf sepenuhnya - alumni tidak memiliki sesi aktif di sistem.
        </p>
      </header>

      <AlumniManager testimonials={testimonials} />
    </div>
  );
}
