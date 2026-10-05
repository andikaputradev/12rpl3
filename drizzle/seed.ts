/**
 * SEED DATA - PENGEMBANGAN LOKAL SAJA.
 *
 * Berkas ini TIDAK pernah dijalankan otomatis di produksi. Seluruh nama,
 * riwayat, dan foto di bawah adalah data contoh untuk keperluan development
 * (bukan riwayat faktual kelas sesungguhnya - itu wajib diisi oleh Wali
 * Kelas/Pengurus lewat form admin setelah deploy, sesuai Asumsi Kunci #4
 * Fase 1).
 *
 * Prasyarat: setiap baris `profiles` mengacu ke `auth.users.id` yang harus
 * sudah ada (trigger `handle_new_auth_user` dari Fase 0 membuatnya otomatis
 * saat user Supabase Auth dibuat). Jalankan skrip ini HANYA terhadap
 * database development yang usernya sudah diprovisikan, mis. lewat Supabase
 * CLI lokal (`supabase start` + `supabase auth admin`), bukan terhadap
 * project produksi.
 *
 * Jalankan: `pnpm tsx drizzle/seed.ts` (butuh SUPABASE_DB_URL di .env.local).
 */
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  academicEvents,
  berandaHighlights,
  classProfile,
  galleryAlbums,
  galleryItems,
  profiles,
} from "@/lib/db/schema";

const DEV_WALI_KELAS_ID = randomUUID();
const DEV_KETUA_ID = randomUUID();
const DEV_WAKIL_ID = randomUUID();
const DEV_SEKRETARIS_ID = randomUUID();

async function seed() {
  console.warn("[seed] Menulis data pengembangan LOKAL - jangan jalankan terhadap produksi.");

  await db
    .insert(classProfile)
    .values({
      id: 1,
      motto: "[SEED] Berkarya lewat kode, berkarakter lewat budaya.",
      sejarah:
        "[SEED] Contoh narasi sejarah kelas untuk pengembangan lokal. Ganti lewat dashboard admin sebelum rilis produksi.",
      visi: "[SEED] Menjadi kelas RPL yang kolaboratif, adaptif, dan berdaya saing.",
      misi: [
        "[SEED] Membangun budaya belajar kolaboratif antar siswa.",
        "[SEED] Menghasilkan proyek RPL yang bermanfaat bagi sekolah.",
        "[SEED] Menjaga kekompakan hingga hari kelulusan.",
      ],
      tahunAjaran: "2026/2027",
    })
    .onConflictDoNothing();

  await db
    .insert(profiles)
    .values([
      {
        id: DEV_WALI_KELAS_ID,
        fullName: "[SEED] Wali Kelas Contoh",
        role: "wali_kelas",
        // biome-ignore lint/security/noSecrets: nomor contoh data seed, bukan kredensial nyata.
        publicContact: "081234567890",
        isPublic: true,
      },
      {
        id: DEV_KETUA_ID,
        fullName: "[SEED] Ketua Kelas Contoh",
        role: "pengurus",
        jabatan: "Ketua Kelas",
        gender: "L",
        displayOrder: 1,
      },
      {
        id: DEV_WAKIL_ID,
        fullName: "[SEED] Wakil Ketua Contoh",
        role: "pengurus",
        jabatan: "Wakil Ketua",
        gender: "P",
        displayOrder: 2,
      },
      {
        id: DEV_SEKRETARIS_ID,
        fullName: "[SEED] Sekretaris Contoh",
        role: "pengurus",
        jabatan: "Sekretaris",
        gender: "P",
        displayOrder: 3,
      },
    ])
    .onConflictDoNothing();

  await db.insert(academicEvents).values([
    {
      title: "[SEED] Ujian Akhir Sekolah",
      eventDate: new Date(Date.now() + 120 * 86_400_000),
      isFeaturedCountdown: true,
      createdBy: DEV_WALI_KELAS_ID,
    },
    {
      title: "[SEED] Wisuda Kelulusan",
      eventDate: new Date(Date.now() + 180 * 86_400_000),
      isFeaturedCountdown: false,
      createdBy: DEV_WALI_KELAS_ID,
    },
  ]);

  await db.insert(berandaHighlights).values([
    {
      title: "[SEED] Kunjungan Industri",
      description: "[SEED] Contoh deskripsi kegiatan untuk pengembangan lokal.",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      displayOrder: 1,
      createdBy: DEV_WALI_KELAS_ID,
    },
  ]);

  const [seedAlbum] = await db
    .insert(galleryAlbums)
    .values({
      title: "[SEED] Album Contoh",
      slug: "seed-album-contoh",
      category: "kegiatan_belajar",
      description: "[SEED] Album untuk pengembangan lokal dan E2E test.",
      createdBy: DEV_WALI_KELAS_ID,
    })
    .onConflictDoNothing()
    .returning();

  if (seedAlbum) {
    await db.insert(galleryItems).values([
      {
        albumId: seedAlbum.id,
        type: "image",
        mediaUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        caption: "[SEED] Foto contoh 1",
        status: "approved",
        uploadedBy: DEV_WALI_KELAS_ID,
        moderatedBy: DEV_WALI_KELAS_ID,
        moderatedAt: new Date(),
      },
      {
        albumId: seedAlbum.id,
        type: "image",
        mediaUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        caption: "[SEED] Foto contoh 2",
        status: "approved",
        uploadedBy: DEV_WALI_KELAS_ID,
        moderatedBy: DEV_WALI_KELAS_ID,
        moderatedAt: new Date(),
      },
    ]);
  }

  console.warn("[seed] Selesai.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Gagal:", error);
    process.exit(1);
  });
