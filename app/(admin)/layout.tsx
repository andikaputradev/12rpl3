import { forbidden, redirect } from "next/navigation";
import type * as React from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { siteConfig } from "@/lib/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const STAFF_ROLES = new Set(["super_admin", "wali_kelas", "pengurus"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, jabatan, full_name")
    .eq("id", user.id)
    .single<{ role: string; jabatan?: string | null; full_name?: string }>();

  // Pengguna sudah terautentikasi tapi role tidak berwenang: 403 semantik
  // (bukan redirect diam-diam), sesuai DoD Fase 1.
  if (!profile || !STAFF_ROLES.has(profile.role)) {
    forbidden();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar isAuthenticated userRole={profile.role} />
      <AdminNav userRole={profile.role} jabatan={profile.jabatan ?? null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, title: siteConfig.siteName };
