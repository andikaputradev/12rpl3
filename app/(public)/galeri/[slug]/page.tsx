import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryViewer } from "@/components/galeri/gallery-viewer";
import { Badge } from "@/components/ui/badge";
import { getAlbumBySlug } from "@/lib/actions/galeri";
import { siteConfig } from "@/lib/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { galleryCategoryLabels } from "@/lib/validations/galeri";

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) return { title: "Album Tidak Ditemukan" };

  return {
    title: `${album.title} | Galeri`,
    description: album.description ?? `Album ${album.title} — ${siteConfig.className}.`,
    alternates: { canonical: `/galeri/${album.slug}` },
    openGraph: album.coverImageUrl
      ? {
          images: [{ url: album.coverImageUrl, width: 1200, height: 630, alt: album.title }],
        }
      : undefined,
  };
}

export default async function AlbumDetailPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) notFound();

  let currentUserId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  } catch {
    currentUserId = null;
  }

  return (
    <div className="container-portal py-20">
      <header className="max-w-2xl">
        <Badge>{galleryCategoryLabels[album.category]}</Badge>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          {album.title}
        </h1>
        {album.eventDate ? (
          <p className="mt-2 font-mono text-sm text-muted">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(album.eventDate)}
          </p>
        ) : null}
        {album.description ? <p className="mt-4 text-muted">{album.description}</p> : null}
      </header>

      <div className="mt-12">
        {album.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Belum ada item di album ini.</p>
        ) : (
          <GalleryViewer items={album.items} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}
