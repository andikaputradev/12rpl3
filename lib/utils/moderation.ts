/**
 * Aturan bersama Fase 5 (Asumsi Kunci #3 prompt, ditegaskan berlaku
 * "konsisten di kedua tabel" pada Bagian 9): konten dengan nama terbuka
 * langsung `approved`, konten anonim wajib `pending_review` lebih dulu,
 * karena anonimitas menaikkan risiko penyalahgunaan sehingga sepadan dengan
 * tinjauan tambahan. Diekstrak sebagai satu fungsi murni alih-alih ditulis
 * ulang sebagai ternary di dua berkas mutasi (interaksi-mutations.ts dan
 * kelulusan-mutations.ts) agar kedua tabel tidak bisa diam-diam menyimpang.
 */
export function resolveAnonymousContentStatus(isAnonymous: boolean): "pending_review" | "approved" {
  return isAnonymous ? "pending_review" : "approved";
}
