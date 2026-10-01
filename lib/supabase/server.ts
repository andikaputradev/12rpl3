import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getSupabaseEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Dipanggil dari Server Component: aman diabaikan karena sesi
          // sudah disegarkan oleh proxy.ts pada setiap request.
        }
      },
    },
  });
}

/**
 * Klien service-role melewati RLS sepenuhnya. Hanya untuk operasi
 * server-only tepercaya (mis. provisioning akun oleh Super Admin di fase
 * mendatang) — tidak pernah diimpor dari kode yang bisa berjalan di client.
 */
export function createServiceRoleClient() {
  const env = getSupabaseEnv();
  return createSupabaseJsClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
