"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import { aspirations, auditLog, guestbookEntries, pollOptions, polls } from "@/lib/db/schema";
import { sanitizeUserText } from "@/lib/utils";
import { pollSchema } from "@/lib/validations/interaksi";

export interface ActionState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

async function writeAudit(
  actorId: string,
  action: string,
  tableName: string,
  recordId: string | null,
  before: unknown,
  after: unknown,
) {
  await db.insert(auditLog).values({
    actorId,
    action,
    tableName,
    recordId,
    before: before as object | null,
    after: after as object | null,
  });
}

const STAFF_ROLES = ["super_admin", "wali_kelas", "pengurus"] as const;

export async function approveGuestbookEntry(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menyetujui entri buku tamu." };
  }

  const [before] = await db
    .select()
    .from(guestbookEntries)
    .where(eq(guestbookEntries.id, id))
    .limit(1);
  if (!before) return { error: "Entri buku tamu tidak ditemukan." };

  const [after] = await db
    .update(guestbookEntries)
    .set({ status: "approved", moderatedBy: auth.userId })
    .where(eq(guestbookEntries.id, id))
    .returning();

  await writeAudit(auth.userId, "approve", "guestbook_entries", id, before, after);

  revalidatePath(before.context === "wisuda" ? "/kelulusan" : "/interaksi/buku-tamu");
  revalidatePath("/dashboard/interaksi");
  return { success: true, timestamp: Date.now() };
}

/** Tanpa parameter reason (berbeda dari rejectPortfolio/rejectPost): lihat catatan konsistensi pada laporan eksekusi Fase 5: ketiga tabel baru (guestbook/aspirations/pesan_kesan) sengaja tidak diberi kolom rejectionReason di skema Fase 5, konsisten di ketiganya. */
export async function rejectGuestbookEntry(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menolak entri buku tamu." };
  }

  const [before] = await db
    .select()
    .from(guestbookEntries)
    .where(eq(guestbookEntries.id, id))
    .limit(1);
  if (!before) return { error: "Entri buku tamu tidak ditemukan." };

  const [after] = await db
    .update(guestbookEntries)
    .set({ status: "rejected", moderatedBy: auth.userId })
    .where(eq(guestbookEntries.id, id))
    .returning();

  await writeAudit(auth.userId, "reject", "guestbook_entries", id, before, after);

  revalidatePath("/dashboard/interaksi");
  return { success: true, timestamp: Date.now() };
}

export async function approveAspiration(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menyetujui aspirasi." };
  }

  const [before] = await db.select().from(aspirations).where(eq(aspirations.id, id)).limit(1);
  if (!before) return { error: "Aspirasi tidak ditemukan." };

  const [after] = await db
    .update(aspirations)
    .set({ status: "approved", moderatedBy: auth.userId })
    .where(eq(aspirations.id, id))
    .returning();

  await writeAudit(auth.userId, "approve", "aspirations", id, before, after);

  revalidatePath("/interaksi/aspirasi");
  revalidatePath("/dashboard/interaksi");
  return { success: true, timestamp: Date.now() };
}

export async function rejectAspiration(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menolak aspirasi." };
  }

  const [before] = await db.select().from(aspirations).where(eq(aspirations.id, id)).limit(1);
  if (!before) return { error: "Aspirasi tidak ditemukan." };

  const [after] = await db
    .update(aspirations)
    .set({ status: "rejected", moderatedBy: auth.userId })
    .where(eq(aspirations.id, id))
    .returning();

  await writeAudit(auth.userId, "reject", "aspirations", id, before, after);

  revalidatePath("/dashboard/interaksi");
  return { success: true, timestamp: Date.now() };
}

export async function createPoll(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang membuat polling." };
  }

  const rawCloses = String(formData.get("closesAt") ?? "");
  const parsed = pollSchema.safeParse({
    question: formData.get("question"),
    description: formData.get("description") || undefined,
    allowMultipleChoice: formData.get("allowMultipleChoice") === "on",
    showResultsBeforeClose: formData.get("showResultsBeforeClose") === "on",
    closesAt: rawCloses,
    options: formData
      .getAll("options")
      .map(String)
      .filter((label) => label.trim() !== ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data polling tidak valid." };
  }

  const closesAt = parsed.data.closesAt ? new Date(parsed.data.closesAt) : null;
  if (closesAt && Number.isNaN(closesAt.getTime())) {
    return { error: "Tanggal penutupan tidak valid." };
  }

  try {
    const createdId = await db.transaction(async (tx) => {
      const [poll] = await tx
        .insert(polls)
        .values({
          question: sanitizeUserText(parsed.data.question, 300),
          description: parsed.data.description
            ? sanitizeUserText(parsed.data.description, 500)
            : null,
          allowMultipleChoice: parsed.data.allowMultipleChoice,
          showResultsBeforeClose: parsed.data.showResultsBeforeClose,
          closesAt,
          createdBy: auth.userId,
        })
        .returning({ id: polls.id });

      if (!poll) throw new Error("Gagal membuat baris polling.");

      await tx.insert(pollOptions).values(
        parsed.data.options.map((label, index) => ({
          pollId: poll.id,
          label: sanitizeUserText(label, 120),
          displayOrder: index,
        })),
      );

      return poll.id;
    });

    await writeAudit(auth.userId, "create", "polls", createdId, null, {
      question: parsed.data.question,
      optionCount: parsed.data.options.length,
    });
  } catch (error) {
    console.error("[admin-interaksi] Gagal membuat polling:", error);
    return { error: "Gagal membuat polling. Coba lagi nanti." };
  }

  revalidatePath("/interaksi/polling");
  revalidatePath("/dashboard/interaksi");
  return { success: true, timestamp: Date.now() };
}

export async function closePoll(id: string): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireStaffRole>>;
  try {
    auth = await requireStaffRole(STAFF_ROLES);
  } catch {
    return { error: "Anda tidak berwenang menutup polling." };
  }

  const [before] = await db.select().from(polls).where(eq(polls.id, id)).limit(1);
  if (!before) return { error: "Polling tidak ditemukan." };

  const [after] = await db
    .update(polls)
    .set({ closesAt: new Date() })
    .where(eq(polls.id, id))
    .returning();

  await writeAudit(auth.userId, "close", "polls", id, before, after);

  revalidatePath("/interaksi/polling");
  revalidatePath("/dashboard/interaksi");
  return { success: true, timestamp: Date.now() };
}
