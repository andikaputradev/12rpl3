import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export type ProxyRole = "super_admin" | "wali_kelas" | "pengurus" | "siswa";

interface UpdateSessionResult {
  response: NextResponse;
  userId: string | null;
  role: ProxyRole | null;
}

export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<UpdateSessionResult> {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, userId: null, role: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() memvalidasi JWT langsung ke Supabase Auth, bukan hanya
  // membaca cookie - mencegah sesi yang sudah dicabut tetap diterima.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response, userId: null, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: ProxyRole }>();

  return { response, userId: user.id, role: profile?.role ?? null };
}
