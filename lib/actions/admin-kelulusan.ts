import "server-only";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { pesanKesan, profiles } from "@/lib/db/schema";

const STAFF_ROLES = ["super_admin", "wali_kelas", "pengurus"] as const;

export interface PendingPesanKesan {
  id: string;
  message: string;
  isAnonymous: boolean;
  fromName: string;
  toName: string;
  createdAt: Date;
}

/** fromName/toName SELALU nama asli untuk staf: anonimitas hanya berlaku terhadap sesama siswa (Asumsi Kunci #4 prompt). */
export async function getPendingPesanKesan(): Promise<PendingPesanKesan[]> {
  await requireStaffRole(STAFF_ROLES);

  const toProfiles = alias(profiles, "to_profiles");

  return db
    .select({
      id: pesanKesan.id,
      message: pesanKesan.message,
      isAnonymous: pesanKesan.isAnonymous,
      createdAt: pesanKesan.createdAt,
      fromName: profiles.fullName,
      toName: toProfiles.fullName,
    })
    .from(pesanKesan)
    .innerJoin(profiles, eq(pesanKesan.fromStudentId, profiles.id))
    .innerJoin(toProfiles, eq(pesanKesan.toStudentId, toProfiles.id))
    .where(eq(pesanKesan.status, "pending_review"))
    .orderBy(asc(pesanKesan.createdAt));
}
