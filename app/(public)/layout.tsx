import type * as React from "react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { VisitorTracker } from "@/components/shared/visitor-tracker";
import { hasCountedVisit } from "@/lib/actions/visitor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let isAuthenticated = false;
  let userRole: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: string }>();
      userRole = profile?.role ?? null;
    }
  } catch {
    isAuthenticated = false;
    userRole = null;
  }

  const alreadyCounted = await hasCountedVisit();

  return (
    <div className="flex min-h-screen flex-col">
      {alreadyCounted ? null : <VisitorTracker />}
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
