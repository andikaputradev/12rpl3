export const siteConfig = {
  schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "SMK Negeri 1 Sukoharjo",
  className: process.env.NEXT_PUBLIC_CLASS_NAME ?? "XII RPL 3",
  jurusan: "Rekayasa Perangkat Lunak",
  siteName: "Portal XII RPL 3",
  tagline: "Identitas digital kelas Rekayasa Perangkat Lunak, SMK Negeri 1 Sukoharjo.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  graduationTargetDate: process.env.NEXT_PUBLIC_GRADUATION_TARGET_DATE ?? null,
  academicYearStartDate: process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_DATE ?? null,
  heroBackgroundUrl:
    "https://res.cloudinary.com/doacdf3gx/image/upload/v1783608991/wedding_gallery_bulk/skorsa-bg_bsqhwp.jpg",
} as const;

export const navModules = [
  { label: "Beranda", href: "/" },
  { label: "Profil Kelas", href: "/profil" },
  { label: "Direktori Siswa", href: "/direktori" },
  { label: "Galeri", href: "/galeri" },
  { label: "Jadwal & Agenda", href: "/jadwal" },
  { label: "Prestasi", href: "/prestasi" },
  { label: "Blog Kelas", href: "/blog" },
  { label: "Buku Tamu", href: "/interaksi/buku-tamu" },
  { label: "Papan Aspirasi", href: "/interaksi/aspirasi" },
  { label: "Polling", href: "/interaksi/polling" },
  { label: "Corner Kelulusan", href: "/kelulusan" },
] as const;

export const protectedModules = [
  { label: "Nilai", href: "/akademik/nilai" },
  { label: "Absensi", href: "/akademik/absensi" },
  { label: "Bank Tugas", href: "/akademik/tugas" },
  { label: "Pengumuman", href: "/akademik/pengumuman" },
  { label: "Kas Kelas", href: "/kas" },
  { label: "Submit Portofolio", href: "/portofolio/submit" },
  { label: "Tulisan Saya", href: "/blog/tulisan-saya" },
  { label: "Profil Saya", href: "/profil-saya" },
] as const;

export const adminModules = [
  { label: "Ikhtisar", href: "/dashboard" },
  { label: "Profil Kelas", href: "/dashboard/profil" },
  { label: "Manajemen Pengguna", href: "/dashboard/pengguna" },
  { label: "Moderasi Konten", href: "/dashboard/moderasi" },
  { label: "Jadwal & Agenda", href: "/dashboard/jadwal" },
  { label: "Entry Nilai", href: "/dashboard/nilai" },
  { label: "Entry Absensi", href: "/dashboard/absensi" },
  { label: "Tugas", href: "/dashboard/tugas" },
  { label: "Pengumuman", href: "/dashboard/pengumuman" },
  { label: "Audit Log Nilai/Absensi", href: "/dashboard/audit-log" },
  { label: "Kas Digital", href: "/dashboard/kas" },
  { label: "Prestasi", href: "/dashboard/prestasi" },
  { label: "Portofolio", href: "/dashboard/portofolio" },
  { label: "Alumni", href: "/dashboard/alumni" },
  { label: "Blog", href: "/dashboard/blog" },
  { label: "Interaksi", href: "/dashboard/interaksi" },
  { label: "Corner Kelulusan", href: "/dashboard/kelulusan" },
] as const;
