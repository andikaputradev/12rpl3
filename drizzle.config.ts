import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL wajib diset untuk menjalankan drizzle-kit.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL,
  },
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
