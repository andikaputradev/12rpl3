import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { KelulusanContentForm } from "@/components/admin/kelulusan-content-form";
import { PesanKesanModerationList } from "@/components/admin/pesan-kesan-moderation-list";
import { getPendingPesanKesan } from "@/lib/actions/admin-kelulusan";
import { requireAuthenticatedUser } from "@/lib/actions/guard";
import { getKelulusanContent } from "@/lib/actions/kelulusan";

export const metadata: Metadata = {
  title: "Kelola Corner Kelulusan",
};

// Sama seperti class_profile (0003) dan kelulusan_content_update_staff
// (0012/0013): TANPA pengurus. Layout (admin) hanya memeriksa "staf peran
// apapun"; pengecekan lebih sempit ini dilakukan di sini agar pengurus tidak
// disuguhi form yang akan selalu ditolak Server Action (UX yang jujur,
// bukan sekadar menyandalkan penolakan server).
const CONTENT_SETTINGS_ROLES = new Set(["super_admin", "wali_kelas"]);

export default async function AdminKelulusanPage() {
  const [{ profile }, pending, content] = await Promise.all([
    requireAuthenticatedUser(),
    getPendingPesanKesan(),
    getKelulusanContent(),
  ]);
  const canEditContent = CONTENT_SETTINGS_ROLES.has(profile.role);

  return (
    <div className="container-portal py-8">
      <h1 className="font-display text-2xl">Kelola Corner Kelulusan</h1>
      <p className="mt-1 text-muted text-sm">
        Moderasi pesan-kesan dan kelola teks pengantar serta video kompilasi.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="mb-3 font-medium text-sm uppercase tracking-wide text-muted">
            Moderasi Pesan-Kesan {pending.length > 0 ? `(${pending.length})` : ""}
          </h2>
          <PesanKesanModerationList initialItems={pending} />
        </section>

        <section>
          <h2 className="mb-3 font-medium text-sm uppercase tracking-wide text-muted">
            Konten Halaman
          </h2>
          {canEditContent ? (
            <KelulusanContentForm content={content} />
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-border border-dashed bg-surface/50 p-5 text-muted text-sm">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                Hanya Super Admin dan Wali Kelas yang dapat mengubah teks pengantar dan video
                kompilasi.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
