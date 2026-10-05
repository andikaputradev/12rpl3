/**
 * Konfigurasi Terpusat Pembatasan Laju (Rate Limiting)
 * Portal Digital Kelas XII RPL 3 - SMKN 1 Sukoharjo
 *
 * Mengonsolidasikan seluruh batas laju lintas Fase 0 sampai Fase 5 ke dalam
 * satu berkas konfigurasi tunggal (Fase 6 Bagian 9) agar seluruh kebijakan
 * terlihat jelas, konsisten, dan mudah disesuaikan tanpa tersebar di berbagai
 * berkas Server Action.
 */

export interface RateLimitRule {
  readonly maxRequests: number;
  readonly window: `${number} ${"s" | "m" | "h" | "d"}`;
  readonly prefix: string;
  readonly target: "ip" | "user" | "user_ip" | "global";
  readonly description: string;
}

export const RATE_LIMITS = {
  /**
   * Fase 0: Mencegah brute-force password login pada /login.
   * Dibatasi per IP/identifier percobaan login.
   */
  auth: {
    maxRequests: 5,
    window: "5 m",
    prefix: "ratelimit:auth",
    target: "ip",
    description: "Maksimal 5 percobaan autentikasi per 5 menit untuk mencegah brute force",
  },

  /**
   * Fase 1: Mencegah spam pemanggilan mutasi publik (misalnya RPC counter pengunjung).
   */
  publicWrite: {
    maxRequests: 10,
    window: "10 m",
    prefix: "ratelimit:write",
    target: "ip",
    description: "Maksimal 10 penulisan publik per 10 menit per IP",
  },

  /**
   * Fase 2: Mencegah spam unggahan foto galeri ke Cloudinary.
   * Dibatasi per kombinasi userId siswa dan alamat IP.
   */
  galleryUpload: {
    maxRequests: 10,
    window: "24 h",
    prefix: "ratelimit:gallery-upload",
    target: "user_ip",
    description: "Maksimal 10 unggahan berkas galeri per 24 jam per siswa",
  },

  /**
   * Fase 3: Batas unggah/kirim tugas per siswa.
   * Dibatasi berdasarkan userId siswa (bukan IP, agar siswa satu jaringan sekolah tidak saling membatasi).
   */
  assignmentSubmission: {
    maxRequests: 20,
    window: "24 h",
    prefix: "ratelimit:assignment-submit",
    target: "user",
    description: "Maksimal 20 pengiriman tugas per 24 jam per siswa",
  },

  /**
   * Fase 4: Mencegah spam antrean moderasi portofolio proyek.
   */
  portfolioSubmission: {
    maxRequests: 5,
    window: "24 h",
    prefix: "ratelimit:portfolio-submit",
    target: "user",
    description: "Maksimal 5 pengajuan portofolio per 24 jam per siswa",
  },

  /**
   * Fase 4: Mencegah spam pembuatan draf/publikasi artikel blog siswa.
   */
  blogPost: {
    maxRequests: 10,
    window: "24 h",
    prefix: "ratelimit:blog-post",
    target: "user",
    description: "Maksimal 10 draf/artikel blog baru per 24 jam per siswa",
  },

  /**
   * Fase 4: Mencegah spam komentar artikel blog.
   */
  blogComment: {
    maxRequests: 20,
    window: "10 m",
    prefix: "ratelimit:blog-comment",
    target: "user",
    description: "Maksimal 20 komentar artikel blog per 10 menit per pengguna",
  },

  /**
   * Fase 5: Buku tamu (satu-satunya jalur tulis publik tanpa login).
   * Dibatasi ketat per IP pengunjung.
   */
  guestbookSubmission: {
    maxRequests: 5,
    window: "1 h",
    prefix: "ratelimit:guestbook",
    target: "ip",
    description: "Maksimal 5 entri buku tamu per 1 jam per IP",
  },

  /**
   * Fase 5: Pengiriman aspirasi kelas.
   */
  aspirationSubmission: {
    maxRequests: 10,
    window: "24 h",
    prefix: "ratelimit:aspiration",
    target: "user",
    description: "Maksimal 10 pengiriman aspirasi per 24 jam per siswa",
  },

  /**
   * Fase 5: Pengiriman pesan kesan kelulusan antar-siswa.
   */
  pesanKesanSubmission: {
    maxRequests: 20,
    window: "24 h",
    prefix: "ratelimit:pesan-kesan",
    target: "user",
    description: "Maksimal 20 pesan kesan per 24 jam per siswa",
  },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitKey = keyof typeof RATE_LIMITS;
