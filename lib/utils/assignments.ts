export type SubmissionStatus = "belum" | "terkumpul" | "terlambat";

/**
 * "Terlambat" mencakup DUA kondisi: (a) sudah dikumpulkan tapi submittedAt >
 * dueDate, atau (b) belum dikumpulkan sama sekali dan dueDate sudah lewat -
 * keduanya ditampilkan sebagai "Terlambat" karena sama-sama actionable bagi
 * siswa (segera kumpulkan / catatan bahwa kiriman sebelumnya telat), bukan
 * disembunyikan sebagai status netral. Diisolasi dari Server Action agar
 * dapat diuji tanpa database.
 */
export function computeSubmissionStatus(
  dueDate: Date,
  submittedAt: Date | null,
  now: Date = new Date(),
): SubmissionStatus {
  if (submittedAt) {
    return submittedAt.getTime() > dueDate.getTime() ? "terlambat" : "terkumpul";
  }
  return now.getTime() > dueDate.getTime() ? "terlambat" : "belum";
}
