import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { type Profile, profiles } from "@/lib/db/schema";

export async function getAllUsersForAdmin(): Promise<Profile[]> {
  return db
    .select()
    .from(profiles)
    .orderBy(asc(profiles.role), asc(profiles.absenNumber), asc(profiles.fullName));
}
