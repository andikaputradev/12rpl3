import { MessageCircleHeart } from "lucide-react";
import type { Metadata } from "next";
import { PesanKesanForm } from "@/components/kelulusan/pesan-kesan-form";
import { getStudentList } from "@/lib/actions/direktori";
import { requireAuthenticatedUser } from "@/lib/actions/guard";

export const metadata: Metadata = {
  title: "Tulis Pesan-Kesan",
};

export default async function TulisPesanKesanPage() {
  const [{ userId }, students] = await Promise.all([requireAuthenticatedUser(), getStudentList()]);

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 text-accent-text">
          <MessageCircleHeart className="size-5" aria-hidden="true" />
          <p className="font-medium text-sm uppercase tracking-wide">Corner Kelulusan</p>
        </div>
        <h1 className="mt-2 font-display text-3xl">Tulis Pesan untuk Teman</h1>
        <p className="mt-2 text-muted">
          Pesan tampil di feed publik setelah ditinjau, kecuali kamu memilih anonim (tetap ditinjau
          lebih dulu). Mengirim ulang ke penerima yang sama akan menimpa pesan sebelumnya.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <PesanKesanForm students={students} currentStudentId={userId} />
        </div>
      </div>
    </div>
  );
}
