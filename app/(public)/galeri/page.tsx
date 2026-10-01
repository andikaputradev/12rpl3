import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTabs } from "@/components/galeri/category-tabs";
import { LoadMoreAlbums } from "@/components/galeri/load-more-albums";
import { Button } from "@/components/ui/button";
import { getAlbums } from "@/lib/actions/galeri";
import { siteConfig } from "@/lib/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { galleryCategories } from "@/lib/validations/galeri";

export const metadata: Metadata = {
  title: `Galeri | ${siteConfig.className} ${siteConfig.schoolName}`,
  description: `Dokumentasi kegiatan ${siteConfig.className} dalam foto dan video.`,
  alternates: { canonical: "/galeri" },
};

interface GaleriPageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function GaleriPage({ searchParams }: GaleriPageProps) {
  const { kategori } = await searchParams;
  const category = galleryCategories.find((c) => c === kategori);

  const [{ albums, nextCursor }, isAuthenticated] = await Promise.all([
    getAlbums(category),
    isUserAuthenticated(),
  ]);

  return (
    <div className="container-portal py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header>
          <p data-eyebrow>Dokumentasi</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Galeri
          </h1>
        </header>

        <Button asChild>
          <Link href={isAuthenticated ? "/galeri/upload" : "/login?redirectTo=/galeri/upload"}>
            {isAuthenticated ? "Unggah Foto" : "Masuk untuk Unggah"}
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <CategoryTabs active={category ?? "semua"} />
      </div>

      <div className="mt-10">
        <LoadMoreAlbums
          key={category ?? "semua"}
          initialAlbums={albums}
          initialCursor={nextCursor}
          category={category}
        />
      </div>
    </div>
  );
}

async function isUserAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}
