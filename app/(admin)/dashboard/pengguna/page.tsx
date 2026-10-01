import type { Metadata } from "next";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { getAllUsersForAdmin } from "@/lib/actions/admin-pengguna";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Manajemen Pengguna — Dashboard",
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
