import type { MetadataRoute } from "next";
import { getPublishedPostSlugs } from "@/lib/actions/blog";
import { getIndexableAlbumSlugs } from "@/lib/actions/galeri";
import { siteConfig } from "@/lib/config/site";

// /jadwal (Fase 3), /prestasi, /blog (Fase 4), dan /interaksi/buku-tamu,
// /interaksi/polling (Fase 5) tidak lagi skeleton "segera hadir": dipindah
// ke staticRoutes di bawah. /interaksi/aspirasi dan /kelulusan (beserta
// sub-halamannya) SENGAJA tetap dikeluarkan, bukan lagi karena skeleton,
// melainkan noindex permanen (lihat generateMetadata masing-masing halaman):
// keduanya mengagregasi konten personal terkait individu yang kemungkinan
// besar masih di bawah umur (Bagian 10 prompt Fase 5). /direktori/[slug]
// individual dan artikel blog berstatus selain published juga sengaja tidak
// dimasukkan (noindex, lihat generateMetadata masing-masing halaman). Album
// galeri kosong (belum ada item approved) juga dikeluarkan.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [albumSlugs, postSlugs] = await Promise.all([
    getIndexableAlbumSlugs().catch((error) => {
      console.error("[sitemap] Gagal mengambil slug album saat build:", error);
      return [] as string[];
    }),
    getPublishedPostSlugs().catch((error) => {
      console.error("[sitemap] Gagal mengambil slug artikel blog saat build:", error);
      return [] as string[];
    }),
  ]);

  const staticRoutes: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/profil", priority: 0.8, freq: "monthly" },
    { path: "/direktori", priority: 0.7, freq: "monthly" },
    { path: "/galeri", priority: 0.8, freq: "weekly" },
    { path: "/jadwal", priority: 0.6, freq: "weekly" },
    { path: "/prestasi", priority: 0.7, freq: "weekly" },
    { path: "/blog", priority: 0.8, freq: "daily" },
    { path: "/interaksi/buku-tamu", priority: 0.5, freq: "weekly" },
    { path: "/interaksi/polling", priority: 0.5, freq: "weekly" },
  ];

  const albumRoutes = albumSlugs.map((slug) => ({
    path: `/galeri/${slug}`,
    priority: 0.6,
    freq: "weekly" as const,
  }));

  const postRoutes = postSlugs.map((slug) => ({
    path: `/blog/${slug}`,
    priority: 0.6,
    freq: "monthly" as const,
  }));

  return [...staticRoutes, ...albumRoutes, ...postRoutes].map((route) => ({
    url: `${siteConfig.appUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.freq,
    priority: route.priority,
  }));
}
