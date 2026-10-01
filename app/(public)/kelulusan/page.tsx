import { GraduationCap, Inbox, Video } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { YoutubeFacade } from "@/components/galeri/youtube-facade";
import { GuestbookForm } from "@/components/interaksi/guestbook-form";
import { GuestbookWall } from "@/components/interaksi/guestbook-wall";
import { PesanKesanCard } from "@/components/kelulusan/pesan-kesan-card";
import { YearbookGrid } from "@/components/kelulusan/yearbook-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOptionalUser } from "@/lib/actions/guard";
import { getGuestbookEntries } from "@/lib/actions/interaksi";
import {
  getKelulusanContent,
  getPesanKesanPublicFeed,
  getPesanKesanReceived,
  getYearbookEntries,
} from "@/lib/actions/kelulusan";
import { extractYoutubeVideoId } from "@/lib/youtube/oembed";

// noindex (Bagian 10 prompt): mengagregasi konten personal terkait individu
// yang kemungkinan besar masih di bawah umur.
export const metadata: Metadata = {
  title: "Corner Kelulusan",
  robots: { index: false, follow: true },
};

export default async function KelulusanPage() {
  const [content, yearbook, feed, wisudaEntries, auth, requestHeaders] = await Promise.all([
    getKelulusanContent(),
    getYearbookEntries(),
    getPesanKesanPublicFeed(),
    getGuestbookEntries("wisuda"),
    getOptionalUser(),
    headers(),
  ]);
  const nonce = requestHeaders.get("x-nonce") ?? "";
  const received = auth ? await getPesanKesanReceived() : [];
  const videoId = content.compilationVideoUrl
    ? extractYoutubeVideoId(content.compilationVideoUrl)
    : null;

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex items-center justify-center gap-2 text-accent-text">
          <GraduationCap className="size-5" aria-hidden="true" />
          <p className="font-medium text-sm uppercase tracking-wide">Corner Kelulusan</p>
        </div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Selamat Jalan, XII RPL 3</h1>
        {content.introText ? (
          <p className="mt-3 whitespace-pre-wrap text-muted">{content.introText}</p>
        ) : null}
      </div>

      {/* Yearbook Digital */}
      <section className="mx-auto mt-14 max-w-6xl">
        <h2 className="mb-5 font-display text-2xl">Yearbook Digital</h2>
        <YearbookGrid entries={yearbook} />
      </section>

      {/* Pesan dan Kesan */}
      <section className="mx-auto mt-14 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Pesan dan Kesan</h2>
          <Button asChild>
            <Link href="/kelulusan/tulis-pesan">Tulis Pesan untuk Teman</Link>
          </Button>
        </div>

        {auth ? (
          <Card className="mt-5 border-accent/30 bg-accent/5">
            <CardContent className="flex items-start gap-3">
              <Inbox className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-medium text-sm">Pesan untukmu ({received.length})</p>
                {received.length === 0 ? (
                  <p className="mt-1 text-muted text-sm">Belum ada pesan-kesan masuk untukmu.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {received.map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="text-muted">
                          {item.fromName ?? "Anonim"}
                          {item.status === "pending_review" ? " · menunggu tinjauan" : ""}:
                        </span>{" "}
                        {item.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-5">
          <PesanKesanCard initialItems={feed.items} initialNextCursor={feed.nextCursor} />
        </div>
      </section>

      {/* Video Kompilasi Kenangan */}
      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="mb-5 flex items-center gap-2 font-display text-2xl">
          <Video className="size-5 text-accent" aria-hidden="true" />
          Video Kompilasi Kenangan
        </h2>
        {videoId ? (
          <YoutubeFacade
            videoId={videoId}
            thumbnailUrl={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            title="Video Kompilasi Kenangan Kelas XII RPL 3"
            className="aspect-video w-full overflow-hidden rounded-xl border border-border"
          />
        ) : (
          <p className="rounded-lg border border-border border-dashed bg-surface/50 px-4 py-10 text-center text-muted text-sm">
            Video kompilasi belum diunggah admin.
          </p>
        )}
      </section>

      {/* Buku Tamu Wisuda: komponen sama persis dengan Buku Tamu umum,
          parameter context berbeda (Bagian 6 prompt). */}
      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="mb-5 font-display text-2xl">Buku Tamu Wisuda</h2>
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <GuestbookForm context="wisuda" nonce={nonce} />
        </div>
        <div className="mt-6">
          <GuestbookWall entries={wisudaEntries} />
        </div>
      </section>
    </div>
  );
}
