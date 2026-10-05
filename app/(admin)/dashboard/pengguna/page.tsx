import type { Metadata } from "next";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { getAllUsersForAdmin } from "@/lib/actions/admin-pengguna";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Manajemen Pengguna | Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPenggunaPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle<{ role: string }>();

  if (currentProfile?.role !== "super_admin") {
    return (
      <div className="container-portal py-16 flex justify-center">
        <div className="max-w-md w-full rounded-lg border border-border bg-surface p-6 text-center shadow-xs">
          <div className="mx-auto size-12 rounded-full bg-accent/15 flex items-center justify-center text-accent-text mb-3">
            <span className="font-mono text-xl font-bold">!</span>
          </div>
          <h2 className="font-display text-lg font-semibold">Akses Terbatas: Super Admin</h2>
          <p className="text-sm text-muted mt-2">
            Manajemen akun pengguna dan hak akses portal hanya dapat dikelola oleh Administrator
            Sistem.
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-background transition-colors"
            >
              Kembali ke Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  const allUsers = await getAllUsersForAdmin();

  return (
    <div className="container-portal flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p data-eyebrow>Dashboard Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-sm text-muted">
            Kelola data akun siswa, pengurus, wali kelas, serta hak akses portal kelas.
          </p>
        </div>
      </header>

      <UserManagementTable
        users={allUsers}
        currentUserId={user?.id ?? ""}
        currentUserRole={currentProfile?.role ?? "siswa"}
      />
    </div>
  );
}
