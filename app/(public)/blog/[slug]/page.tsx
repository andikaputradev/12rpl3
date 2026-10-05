import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/blog/comment-form";
import { CommentList } from "@/components/blog/comment-list";
import { ReadingProgressBar } from "@/components/blog/reading-progress-bar";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { getComments, getPostBySlug } from "@/lib/actions/blog";
import { siteConfig } from "@/lib/config/site";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cloudinaryOptimized } from "@/lib/utils";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (post?.status !== "published") {
    return { title: "Artikel Tidak Ditemukan", robots: { index: false, follow: false } };
  }

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName],
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

async function getCurrentUserContext(): Promise<{ userId: string | null; isStaff: boolean }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, isStaff: false };
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  const isStaff = profile
    ? ["super_admin", "wali_kelas", "pengurus"].includes(profile.role)
    : false;
  return { userId: user.id, isStaff };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const isPublished = post.status === "published";
  const [comments, { userId, isStaff }, nonce] = await Promise.all([
    isPublished ? getComments(post.id) : Promise.resolve([]),
    getCurrentUserContext(),
    headers().then((h) => h.get("x-nonce") ?? ""),
  ]);

  const jsonLd = isPublished
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.publishedAt?.toISOString(),
        author: { "@type": "Person", name: post.authorName },
        image: post.coverImageUrl ?? undefined,
        url: `${siteConfig.appUrl}/blog/${post.slug}`,
      }
    : null;

  return (
    <article className="pb-20">
      <ReadingProgressBar />

      {jsonLd ? (
        <script
          type="application/ld+json"
          nonce={nonce}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD dari data artikel yang sudah tersimpan (bukan render langsung input pengguna sebagai HTML), nonce untuk lolos CSP.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <div className="container-portal max-w-3xl py-16">
        {!isPublished ? (
          <div className="mb-8 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/8 px-4 py-3 text-sm">
            <span>Pratinjau - status:</span>
            <StatusBadge status={post.status} />
          </div>
        ) : null}

        {post.categoryName ? (
          <Link href={`/blog?kategori=${post.categorySlug}`}>
            <Badge variant="outline" className="mb-4">
              {post.categoryName}
            </Badge>
          </Link>
        ) : null}

        <h1 className="font-display font-medium text-3xl tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-2 font-mono text-muted text-xs uppercase tracking-[0.06em]">
          <span>{post.authorName}</span>
          {post.publishedAt ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{format(post.publishedAt, "d MMMM yyyy", { locale: idLocale })}</span>
            </>
          ) : null}
        </div>

        {post.coverImageUrl ? (
          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl border border-border">
            <Image
              src={cloudinaryOptimized(post.coverImageUrl, "f_auto,q_auto,w_1200")}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 768px, 100vw"
              priority
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-8">
          <MarkdownRenderer content={post.contentMarkdown} />
        </div>

        {post.tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2 border-border border-t pt-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-border px-3 py-1 text-muted text-xs transition-colors hover:border-accent/50 hover:text-accent-text"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}

        {isPublished ? (
          <div className="mt-12 border-border border-t pt-8">
            <h2 className="font-display font-medium text-lg">Komentar</h2>
            <div className="mt-4">
              <CommentList comments={comments} currentUserId={userId} isStaff={isStaff} />
            </div>
            {userId ? (
              <div className="mt-6">
                <CommentForm postId={post.id} />
              </div>
            ) : (
              <p className="mt-6 text-muted text-sm">
                <Link href="/login" className="text-accent-text underline underline-offset-2">
                  Masuk
                </Link>{" "}
                untuk menulis komentar.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
