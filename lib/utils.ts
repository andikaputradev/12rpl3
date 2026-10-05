import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getInitials(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") return "";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function cloudinaryOptimized(url: string, transform = "f_auto,q_auto"): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/**
 * Pertahanan berlapis untuk teks buatan pengguna (mis. caption galeri): React
 * sudah meng-escape konten JSX secara default sehingga aman dari XSS saat
 * dirender, tapi data yang sama bisa saja dipakai di konteks non-React di
 * masa depan (RSS, notifikasi email, OG image). Menghapus tag HTML dan
 * karakter kontrol di titik penyimpanan menutup celah itu sejak awal.
 */
export function sanitizeUserText(input: string, maxLength: number): string {
  const withoutTags = input.replace(/<[^>]*>/g, "");
  // biome-ignore lint/suspicious/noControlCharactersInRegex: sengaja menyaring karakter kontrol dari input pengguna.
  const withoutControlChars = withoutTags.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return withoutControlChars.trim().slice(0, maxLength);
}

export function getTimeRemaining(target: Date, from: Date = new Date()) {
  const totalMs = Math.max(target.getTime() - from.getTime(), 0);
  return {
    totalMs,
    days: Math.floor(totalMs / 86_400_000),
    hours: Math.floor((totalMs / 3_600_000) % 24),
    minutes: Math.floor((totalMs / 60_000) % 60),
    seconds: Math.floor((totalMs / 1_000) % 60),
  };
}

export function getProgressPercent(start: Date, end: Date, now: Date = new Date()) {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - start.getTime();
  return Math.min(Math.max((elapsed / total) * 100, 0), 100);
}

export function formatIndonesianDate(
  dateInput: Date | string | number | null | undefined,
  includeDayName = false,
): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: includeDayName ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
