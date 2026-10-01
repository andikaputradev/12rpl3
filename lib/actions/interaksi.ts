import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getOptionalUser } from "@/lib/actions/guard";
import { db } from "@/lib/db";
import {
  aspirations,
  type GuestbookContext,
  guestbookEntries,
  pollOptions,
  polls,
  pollVotes,
  profiles,
} from "@/lib/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface GuestbookEntryDisplay {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
}

/** Hanya status approved: pre-moderasi (Bagian 9 prompt) berarti pending_review tidak pernah tampil publik. */
export async function getGuestbookEntries(
  context: GuestbookContext,
): Promise<GuestbookEntryDisplay[]> {
  return db
    .select({
      id: guestbookEntries.id,
      name: guestbookEntries.name,
      message: guestbookEntries.message,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .where(and(eq(guestbookEntries.context, context), eq(guestbookEntries.status, "approved")))
    .orderBy(desc(guestbookEntries.createdAt));
}

export interface AspirationDisplay {
  id: string;
  content: string;
  authorName: string | null;
  isAnonymous: boolean;
  createdAt: Date;
}

/**
 * Hanya status approved (Asumsi Kunci #3 prompt: non-anonim langsung
 * approved, anonim wajib pending_review lebih dulu: feed ini karena itu
 * otomatis hanya berisi aspirasi yang sudah lolos tinjauan bila anonim).
 * authorName di-null-kan di sini untuk baris anonim: komponen tidak pernah
 * menerima nama asli pengirim anonim sama sekali, bukan sekadar diminta
 * menyembunyikannya.
 */
export async function getAspirations(): Promise<AspirationDisplay[]> {
  const rows = await db
    .select({
      id: aspirations.id,
      content: aspirations.content,
      isAnonymous: aspirations.isAnonymous,
      authorName: profiles.fullName,
      createdAt: aspirations.createdAt,
    })
    .from(aspirations)
    .innerJoin(profiles, eq(aspirations.authorId, profiles.id))
    .where(eq(aspirations.status, "approved"))
    .orderBy(desc(aspirations.createdAt));

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    isAnonymous: row.isAnonymous,
    authorName: row.isAnonymous ? null : row.authorName,
    createdAt: row.createdAt,
  }));
}

export interface PollOptionView {
  id: string;
  label: string;
  displayOrder: number;
}

export interface PollWithOptions {
  id: string;
  question: string;
  description: string | null;
  allowMultipleChoice: boolean;
  showResultsBeforeClose: boolean;
  opensAt: Date;
  closesAt: Date | null;
  isClosed: boolean;
  options: PollOptionView[];
}

/** Daftar polling aktif dan tertutup (Bagian 5 prompt): dibedakan lewat isClosed hasil turunan, bukan fungsi terpisah. */
export async function getPolls(): Promise<PollWithOptions[]> {
  const [pollRows, optionRows] = await Promise.all([
    db.select().from(polls).orderBy(desc(polls.createdAt)),
    db
      .select({
        id: pollOptions.id,
        pollId: pollOptions.pollId,
        label: pollOptions.label,
        displayOrder: pollOptions.displayOrder,
      })
      .from(pollOptions)
      .orderBy(asc(pollOptions.displayOrder)),
  ]);

  const optionsByPoll = new Map<string, PollOptionView[]>();
  for (const option of optionRows) {
    const list = optionsByPoll.get(option.pollId) ?? [];
    list.push({ id: option.id, label: option.label, displayOrder: option.displayOrder });
    optionsByPoll.set(option.pollId, list);
  }

  const now = Date.now();
  return pollRows.map((poll) => ({
    id: poll.id,
    question: poll.question,
    description: poll.description,
    allowMultipleChoice: poll.allowMultipleChoice,
    showResultsBeforeClose: poll.showResultsBeforeClose,
    opensAt: poll.opensAt,
    closesAt: poll.closesAt,
    isClosed: Boolean(poll.closesAt && poll.closesAt.getTime() <= now),
    options: optionsByPoll.get(poll.id) ?? [],
  }));
}

export interface PollResultRow {
  optionId: string;
  count: number;
}

/**
 * Memanggil get_poll_results() SECURITY DEFINER lewat klien Supabase (BUKAN
 * koneksi `db` Drizzle langsung): poin arsitektur yang disengaja: fungsi ini
 * dibuat agar aman dipanggil pengguna biasa TANPA hak SELECT langsung ke
 * poll_votes (Bagian 9 prompt, prinsip bilik suara rahasia). Memanggilnya
 * lewat `db` yang memakai kredensial service-level akan melewati seluruh
 * proteksi itu dan meniadakan alasan RPC ini dibuat.
 */
export async function getPollResults(pollId: string): Promise<PollResultRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_poll_results", { target_poll_id: pollId });

  if (error) {
    console.error("[interaksi] Gagal memanggil get_poll_results:", error);
    return [];
  }

  const rows = (data ?? []) as { option_id: string; vote_count: number | string }[];
  return rows.map((row) => ({ optionId: row.option_id, count: Number(row.vote_count) }));
}

/**
 * Mengembalikan array kosong (bukan melempar error) bila belum login:
 * halaman polling bersifat publik, pengunjung anonim dianggap "belum
 * memilih" alih-alih diblokir memuat halaman sama sekali.
 */
export async function getMyVote(pollId: string): Promise<string[]> {
  const auth = await getOptionalUser();
  if (!auth) return [];

  const rows = await db
    .select({ optionId: pollVotes.optionId })
    .from(pollVotes)
    .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterId, auth.userId)));

  return rows.map((row) => row.optionId);
}
