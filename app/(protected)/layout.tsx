import { redirect } from "next/navigation";
import type * as React from "react";
import { ProtectedNav } from "@/components/akademik/protected-nav";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { siteConfig } from "@/lib/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lapis pertahanan kedua: proxy.ts sudah menolak permintaan tak
  // terautentikasi lebih awal, pemeriksaan ini menutup kemungkinan proxy
  // terlewati (mis. kesalahan konfigurasi matcher di masa depan).
  if (!user) {
    redirect("/login?redirectTo=/akademik/nilai");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar isAuthenticated userRole={profile?.role ?? null} />
      <ProtectedNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, title: siteConfig.siteName };
