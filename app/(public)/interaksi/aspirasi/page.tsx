import { MessageSquareWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AspirationFeed } from "@/components/interaksi/aspiration-feed";
import { AspirationForm } from "@/components/interaksi/aspiration-form";
import { Button } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/actions/guard";
import { getAspirations } from "@/lib/actions/interaksi";

// noindex (Bagian 10 prompt): mengagregasi konten personal terkait individu
// yang kemungkinan besar masih di bawah umur.
export const metadata: Metadata = {
  title: "Papan Aspirasi",
  robots: { index: false, follow: true },
};

export default async function AspirasiPage() {
  const auth = await getOptionalUser();

  const aspirations = auth ? await getAspirations() : [];

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 text-accent-text">
          <MessageSquareWarning className="size-5" aria-hidden="true" />
          <p className="font-medium text-sm uppercase tracking-wide">Interaksi</p>
        </div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Papan Aspirasi</h1>
        <p className="mt-2 text-muted">
          Sampaikan masukan, ide, atau keluhan untuk kelas. Wajib masuk untuk mengirim maupun
          melihat papan ini.
        </p>

        {auth ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
            <AspirationForm />
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border border-dashed bg-surface/50 px-6 py-12 text-center">
            <p className="text-muted text-sm">
              Masuk dengan akun kelas untuk membuka papan aspirasi.
            </p>
            <Button asChild>
              <Link href="/login?redirectTo=/interaksi/aspirasi">Masuk</Link>
            </Button>
          </div>
        )}
      </div>

      {auth ? (
        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="mb-4 font-display text-xl">Aspirasi Terkini</h2>
          <AspirationFeed aspirations={aspirations} />
        </div>
      ) : null}
    </div>
  );
}
