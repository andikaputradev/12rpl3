import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BlogPostSummary } from "@/lib/actions/blog";
import { cloudinaryOptimized } from "@/lib/utils";

export function BlogPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-background">
        {post.coverImageUrl ? (
          <Image
            src={cloudinaryOptimized(post.coverImageUrl, "f_auto,q_auto,w_600")}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-3xl text-muted">
            {post.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {post.categoryName ? (
          <Badge variant="outline" className="w-fit">
            {post.categoryName}
          </Badge>
        ) : null}
        <h3 className="font-display font-medium leading-snug">{post.title}</h3>
        {post.excerpt ? <p className="line-clamp-2 text-muted text-sm">{post.excerpt}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-2 font-mono text-[11px] text-muted uppercase tracking-[0.04em]">
          <span>{post.authorName}</span>
          <span>{format(post.publishedAt, "d MMM yyyy", { locale: idLocale })}</span>
        </div>
      </div>
    </Link>
  );
}
