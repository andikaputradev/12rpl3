"use server";

import { getAcademicEvents } from "@/lib/actions/jadwal";
import type { AcademicEvent } from "@/lib/db/schema";

/**
 * Dipanggil dari AcademicCalendar (Client Component) saat navigasi bulan.
 * getAcademicEvents di lib/actions/jadwal.ts adalah server-only biasa untuk
 * render awal Server Component - tidak boleh diimpor langsung oleh Client
 * Component. Berkas terpisah ber-"use server" di level atas ini menjadi
 * satu-satunya jembatan aman, menerapkan pelajaran bug kebocoran driver DB
 * Fase 2 (pemisahan berkas aksi klien vs baca server-only) secara proaktif.
 */
export async function fetchAcademicEventsForMonth(monthIso: string): Promise<AcademicEvent[]> {
  return getAcademicEvents(new Date(monthIso));
}
