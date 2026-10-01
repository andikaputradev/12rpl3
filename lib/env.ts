import "server-only";
import { z } from "zod";

const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SCHOOL_NAME: z.string().min(1),
  NEXT_PUBLIC_CLASS_NAME: z.string().min(1),
});

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

const cloudinaryEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const upstashEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

function parseGroup<T extends z.ZodTypeAny>(schema: T, groupName: string): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Konfigurasi environment untuk "${groupName}" tidak lengkap atau tidak valid. Variabel bermasalah: ${missing}. Lihat .env.example.`,
    );
  }
  return result.data;
}

let appEnvCache: z.infer<typeof appEnvSchema> | null = null;
export function getAppEnv() {
  if (!appEnvCache) appEnvCache = parseGroup(appEnvSchema, "aplikasi");
  return appEnvCache;
}

let supabaseEnvCache: z.infer<typeof supabaseEnvSchema> | null = null;
export function getSupabaseEnv() {
  if (!supabaseEnvCache) supabaseEnvCache = parseGroup(supabaseEnvSchema, "Supabase");
  return supabaseEnvCache;
}

let cloudinaryEnvCache: z.infer<typeof cloudinaryEnvSchema> | null = null;
export function getCloudinaryEnv() {
  if (!cloudinaryEnvCache) {
    cloudinaryEnvCache = parseGroup(cloudinaryEnvSchema, "Cloudinary");
  }
  return cloudinaryEnvCache;
}

let upstashEnvCache: z.infer<typeof upstashEnvSchema> | null = null;
export function getUpstashEnv() {
  if (!upstashEnvCache) upstashEnvCache = parseGroup(upstashEnvSchema, "Upstash Redis");
  return upstashEnvCache;
}

// Fase 5: Cloudflare Turnstile (satu-satunya jalur tulis tanpa autentikasi,
// Bagian 9 prompt). NEXT_PUBLIC_TURNSTILE_SITE_KEY divalidasi longgar (bukan
// z.url()) karena formatnya adalah token opak, bukan URL.
const turnstileEnvSchema = z.object({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
});

let turnstileEnvCache: z.infer<typeof turnstileEnvSchema> | null = null;
export function getTurnstileEnv() {
  if (!turnstileEnvCache)
    turnstileEnvCache = parseGroup(turnstileEnvSchema, "Cloudflare Turnstile");
  return turnstileEnvCache;
}
