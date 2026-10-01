import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
  drizzleClient?: PostgresJsDatabase<typeof schema>;
};

function initDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.drizzleClient) return globalForDb.drizzleClient;

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error(
      "SUPABASE_DB_URL tidak ditemukan. Gunakan connection string pooler (transaction mode, port 6543) dari dashboard Supabase.",
    );
  }

  const poolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10;

  const client =
    globalForDb.postgresClient ??
    postgres(connectionString, {
      prepare: false,
      max: poolMax,
      idle_timeout: 30,
      connect_timeout: 15,
      onnotice: () => {},
    });

  const instance = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgresClient = client;
    globalForDb.drizzleClient = instance;
  }

  return instance;
}

// Proxy menunda pembuatan koneksi sungguhan sampai properti pertama benar-
// benar diakses (mis. `db.select(...)`), bukan saat modul ini diimpor. Ini
// penting agar route yang HANYA statically-analyzed oleh Next.js saat build
// (mis. opengraph-image.tsx) tidak gagal build hanya karena modul ini
// ter-import, padahal query sungguhan baru terjadi saat request nyata.
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      const instance = initDb();
      return Reflect.get(instance as object, prop, receiver);
    },
  },
);
