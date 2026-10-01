import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { GuestbookForm } from "@/components/interaksi/guestbook-form";
import { GuestbookWall } from "@/components/interaksi/guestbook-wall";
import { getGuestbookEntries } from "@/lib/actions/interaksi";

export const metadata: Metadata = {
  title: "Buku Tamu",
  description: "Tinggalkan kesan dan pesan untuk kelas XII RPL 3 SMKN 1 Sukoharjo.",
};

export default async function BukuTamuPage() {
  const [entries, requestHeaders] = await Promise.all([getGuestbookEntries("umum"), headers()]);
  const nonce = requestHeaders.get("x-nonce") ?? "";

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 text-accent-text">
          <BookOpen className="size-5" aria-hidden="true" />
          <p className="font-medium text-sm uppercase tracking-wide">Interaksi</p>
        </div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Buku Tamu</h1>
        <p className="mt-2 text-muted">
          Siapa pun boleh mengisi buku tamu ini, tanpa perlu masuk. Pesan tampil setelah ditinjau.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <GuestbookForm context="umum" nonce={nonce} />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-5xl">
        <h2 className="mb-4 font-display text-xl">Pesan dari Pengunjung</h2>
        <GuestbookWall entries={entries} />
      </div>
    </div>
  );
}
