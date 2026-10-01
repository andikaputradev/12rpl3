import type { EventCategory } from "@/lib/db/schema";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  ujian: "Ujian",
  libur: "Libur",
  deadline_tugas: "Deadline Tugas",
  event_sekolah: "Event Sekolah",
  prakerin: "Prakerin",
  kelulusan: "Kelulusan",
  lainnya: "Lainnya",
};

// Nama CSS custom property (didefinisikan di app/globals.css), bukan hex
// langsung — konsisten dengan seluruh design token Fase 0 (OKLCH via
// culori). Tiga kategori sengaja memakai ulang hue token semantik yang
// sudah ada (destructive/success/accent) karena maknanya selaras secara
// konseptual; empat sisanya memakai hue baru yang harmonis dengan palet.
export const EVENT_CATEGORY_COLOR_VAR: Record<EventCategory, string> = {
  ujian: "var(--category-ujian)",
  libur: "var(--category-libur)",
  deadline_tugas: "var(--category-deadline-tugas)",
  event_sekolah: "var(--category-event-sekolah)",
  prakerin: "var(--category-prakerin)",
  kelulusan: "var(--category-kelulusan)",
  lainnya: "var(--category-lainnya)",
};

export const EVENT_CATEGORY_OPTIONS: EventCategory[] = [
  "ujian",
  "libur",
  "deadline_tugas",
  "event_sekolah",
  "prakerin",
  "kelulusan",
  "lainnya",
];
