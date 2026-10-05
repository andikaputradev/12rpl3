"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { AuthorizationError, getOptionalUser, requireAuthenticatedUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  aspirations,
  auditLog,
  type GuestbookContext,
  guestbookEntries,
  pollOptions,
  polls,
  pollVotes,
} from "@/lib/db/schema";
import { getClientIp, limitAspirationSubmission, limitGuestbookSubmission } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { sanitizeUserText } from "@/lib/utils";
import { resolveAnonymousContentStatus } from "@/lib/utils/moderation";
import { aspirationSchema, guestbookEntrySchema, voteSchema } from "@/lib/validations/interaksi";

export interface ActionState {
  error?: string;
  success?: boolean;
  timestamp?: number;
}

/** Sinyal kontrol-alur internal murni (bukan kegagalan otorisasi) untuk kasus vote ganda di dalam transaksi submitVote. */
class DuplicateVoteError extends Error {}

async function writeAudit(
  actorId: string | null,
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

/**
 * Signature diperluas dengan parameter `context` di depan (di-bind dari
 * GuestbookForm lewat `.bind(null, context)`, pola sama seperti
 * addComment.bind(null, postId) pada blog-mutations.ts): kontrak §4 prompt
 * tidak mencantumkan context sebagai parameter eksplisit, padahal skema §3
 * mewajibkannya dan §6 menegaskan GuestbookForm dipakai ulang untuk kedua
 * konteks. Celah ditutup dengan pola binding yang sudah baku di proyek ini.
 */
export async function submitGuestbookEntry(
  context: GuestbookContext,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot !== "") {
    // Balasan sukses PALSU dengan sengaja (Bagian 9 prompt): skrip otomatis
    // yang mengisi honeypot tidak boleh mendapat sinyal bahwa dirinya
    // terdeteksi. Tidak ada penulisan ke database di jalur ini.
    return { success: true, timestamp: Date.now() };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);

  const { limited } = await limitGuestbookSubmission(ip);
  if (limited) {
    return { error: "Terlalu banyak kiriman dari alamat ini. Coba lagi dalam satu jam." };
  }

  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  if (!turnstileToken) {
    return { error: "Verifikasi keamanan belum selesai. Muat ulang halaman dan coba lagi." };
  }

  const verification = await verifyTurnstileToken(turnstileToken, ip);
  if (!verification.success) {
    return { error: "Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi." };
  }

  const parsed = guestbookEntrySchema.safeParse({
    name: formData.get("name"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const auth = await getOptionalUser();

  try {
    const [created] = await db
      .insert(guestbookEntries)
      .values({
        context,
        name: sanitizeUserText(parsed.data.name, 80),
        message: sanitizeUserText(parsed.data.message, 500),
        authorId: auth?.userId ?? null,
        status: "pending_review",
      })
      .returning({ id: guestbookEntries.id });

    if (created) {
      await writeAudit(auth?.userId ?? null, "create", "guestbook_entries", created.id, null, {
        context,
        status: "pending_review",
      });
    }
  } catch (error) {
    console.error("[interaksi] Gagal menyimpan entri buku tamu:", error);
    return { error: "Gagal mengirim pesan. Coba lagi nanti." };
  }

  revalidatePath(context === "wisuda" ? "/kelulusan" : "/interaksi/buku-tamu");
  return { success: true, timestamp: Date.now() };
}

export async function submitAspiration(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }

  const { limited } = await limitAspirationSubmission(auth.userId);
  if (limited) {
    return { error: "Batas pengiriman aspirasi harian tercapai. Coba lagi dalam 24 jam." };
  }

  const parsed = aspirationSchema.safeParse({
    content: formData.get("content"),
    isAnonymous: formData.get("isAnonymous") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const status = resolveAnonymousContentStatus(parsed.data.isAnonymous);

  try {
    const [created] = await db
      .insert(aspirations)
      .values({
        content: sanitizeUserText(parsed.data.content, 1000),
        isAnonymous: parsed.data.isAnonymous,
        authorId: auth.userId,
        status,
      })
      .returning({ id: aspirations.id });

    if (created) {
      await writeAudit(auth.userId, "create", "aspirations", created.id, null, {
        isAnonymous: parsed.data.isAnonymous,
        status,
      });
    }
  } catch (error) {
    console.error("[interaksi] Gagal menyimpan aspirasi:", error);
    return { error: "Gagal mengirim aspirasi. Coba lagi nanti." };
  }

  revalidatePath("/interaksi/aspirasi");
  return { success: true, timestamp: Date.now() };
}

/**
 * Dipanggil langsung dari PollCard lewat useTransition (bukan
 * useActionState) karena optionIds berasal dari state RadioGroup/Checkbox
 * terpilih di client, bukan dari field form bernama: pola sama seperti
 * approveItem/rejectItem di admin-galeri.ts.
 */
export async function submitVote(pollId: string, optionIds: string[]): Promise<ActionState> {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try {
    auth = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }

  const parsed = voteSchema.safeParse({ pollId, optionIds });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const [poll] = await db.select().from(polls).where(eq(polls.id, parsed.data.pollId)).limit(1);
  if (!poll) {
    return { error: "Polling tidak ditemukan." };
  }
  if (poll.closesAt && poll.closesAt.getTime() <= Date.now()) {
    return { error: "Polling ini sudah ditutup." };
  }
  if (!poll.allowMultipleChoice && parsed.data.optionIds.length > 1) {
    return { error: "Polling ini hanya menerima satu pilihan." };
  }

  const availableOptions = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, parsed.data.pollId));
  const availableOptionIds = new Set(availableOptions.map((option) => option.id));
  if (!parsed.data.optionIds.every((id) => availableOptionIds.has(id))) {
    return { error: "Opsi tidak valid untuk polling ini." };
  }

  try {
    // Dibungkus transaksi agar jendela race antara pemeriksaan "sudah
    // memilih?" dan penulisan suara sesempit mungkin. Constraint unik
    // (poll_votes_poll_option_voter_unique) tetap jadi penjaga akhir untuk
    // opsi yang sama persis; race sangat sempit berupa dua tab memilih DUA
    // opsi berbeda pada polling single-choice secara bersamaan belum
    // ditutup penuh tanpa SELECT ... FOR UPDATE: lihat catatan risiko pada
    // laporan eksekusi Fase 5.
    await db.transaction(async (tx) => {
      const existingVote = await tx
        .select({ id: pollVotes.id })
        .from(pollVotes)
        .where(and(eq(pollVotes.pollId, parsed.data.pollId), eq(pollVotes.voterId, auth.userId)))
        .limit(1);
      if (existingVote.length > 0) {
        throw new DuplicateVoteError("Anda sudah memilih pada polling ini.");
      }

      await tx.insert(pollVotes).values(
        parsed.data.optionIds.map((optionId) => ({
          pollId: parsed.data.pollId,
          optionId,
          voterId: auth.userId,
        })),
      );
    });

    await writeAudit(auth.userId, "create", "poll_votes", parsed.data.pollId, null, {
      optionIds: parsed.data.optionIds,
    });
  } catch (error) {
    if (error instanceof DuplicateVoteError) return { error: error.message };
    console.error("[interaksi] Gagal menyimpan suara:", error);
    return { error: "Gagal mengirim suara. Coba lagi nanti." };
  }

  revalidatePath("/interaksi/polling");
  return { success: true, timestamp: Date.now() };
}
