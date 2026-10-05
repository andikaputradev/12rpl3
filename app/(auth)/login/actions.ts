"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClientIp, limitAuthAttempt } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export interface LoginState {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const rawIdentifier = formData.get("email")?.toString()?.trim() ?? "";
  let resolvedEmail = rawIdentifier;

  if (rawIdentifier && !rawIdentifier.includes("@")) {
    const lower = rawIdentifier.toLowerCase();
    if (lower === "admin" || lower === "andikaputra") {
      resolvedEmail = "andikaputra@12rpl.com";
    } else {
      resolvedEmail = `${lower}@12rpl.com`;
    }
  } else if (rawIdentifier.toLowerCase() === "admin@12rpl.com") {
    resolvedEmail = "andikaputra@12rpl.com";
  }

  const parsed = loginSchema.safeParse({
    email: resolvedEmail,
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") fieldErrors[key] = issue.message;
    }
    return { error: "Periksa kembali data yang dimasukkan.", fieldErrors };
  }

  const ip = getClientIp(await headers());
  const { limited } = await limitAuthAttempt(`login:${ip}`);
  if (limited) {
    return { error: "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Pesan generik disengaja: tidak membedakan "email tidak terdaftar" vs
    // "kata sandi salah" untuk mencegah enumerasi akun.
    return { error: "Email atau kata sandi salah." };
  }

  let destination = parsed.data.redirectTo;

  if (!destination || destination === "/") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle<{ role: string }>();

    const STAFF_ROLES = new Set(["super_admin", "wali_kelas", "pengurus"]);
    if (profile && STAFF_ROLES.has(profile.role)) {
      destination = "/dashboard";
    } else {
      destination = "/akademik/nilai";
    }
  }

  redirect(destination);
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
