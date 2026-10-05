"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#jadwal-hari-ini", label: "Jadwal & Agenda", icon: CalendarDays },
  { href: "#profil-kelas", label: "Profil & Struktur", icon: Sparkles },
  { href: "#anggota-kelas", label: "Anggota Kelas", icon: Users },
  { href: "#karya-prestasi", label: "Karya & Prestasi", icon: Award },
  { href: "#galeri-kegiatan", label: "Galeri Foto", icon: Camera },
  { href: "#blog-terbaru", label: "Blog & Cerita", icon: BookOpen },
  { href: "#interaksi-kelas", label: "Suara & Polling", icon: MessageSquare },
];

export function QuickJumpBar() {
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    function handleScroll() {
      const scrollPos = window.scrollY + 200;
      for (const item of [...NAV_ITEMS].reverse()) {
        const el = document.querySelector(item.href);
        if (el && el instanceof HTMLElement) {
          if (el.offsetTop <= scrollPos) {
            setActiveHash(item.href);
            return;
          }
        }
      }
      setActiveHash("");
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      aria-label="Navigasi Cepat Konten Halaman"
      className="sticky top-16 z-30 -mb-6 border-b border-border/60 bg-background/90 py-2.5 backdrop-blur-md transition-all"
    >
      <div className="container-portal flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted mr-1">
          Menu Halaman:
        </span>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeHash === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                isActive
                  ? "border-accent bg-accent/15 text-accent-text shadow-2xs"
                  : "border-border/60 bg-surface/70 text-muted hover:border-accent/40 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
