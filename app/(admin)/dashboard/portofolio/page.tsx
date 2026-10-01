import type { Metadata } from "next";
import { PortfolioModerationQueue } from "@/components/admin/portfolio-moderation-queue";
import { getPendingPortfolio } from "@/lib/actions/admin-prestasi";

export const metadata: Metadata = {
  title: "Portofolio — Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPortofolioPage() {
  const pending = await getPendingPortfolio();

  return (
    <div className="container-portal flex flex-col gap-8 py-12">
      <header>
        <p data-eyebrow>Dashboard Admin</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Moderasi Portofolio
        </h1>
        <p className="mt-2 max-w-2xl text-muted text-sm">
          Proyek yang disetujui langsung tampil di halaman Prestasi & Portofolio publik.
        </p>
      </header>

      <PortfolioModerationQueue initialItems={pending} />
    </div>
  );
}
