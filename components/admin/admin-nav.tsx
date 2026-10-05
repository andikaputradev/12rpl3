"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminModules } from "@/lib/config/site";
import { cn } from "@/lib/utils";

interface AdminNavProps {
  userRole?: string | null;
  jabatan?: string | null;
}

export function AdminNav({ userRole = "super_admin", jabatan }: AdminNavProps) {
  const pathname = usePathname();

  const jLower = (jabatan ?? "").toLowerCase();

  const visibleModules = adminModules.filter((item) => {
    if (userRole === "super_admin") return true;

    if (userRole === "wali_kelas") {
      // Wali Kelas can access all academic & class modules except system user role management & system audit log
      if (item.href === "/dashboard/pengguna" || item.href === "/dashboard/audit-log") {
        return false;
      }
      return true;
    }

    if (userRole === "pengurus") {
      if (jLower.includes("bendahara")) {
        return ["/dashboard", "/dashboard/kas", "/dashboard/pengumuman"].includes(item.href);
      }
      if (jLower.includes("sekretaris")) {
        return [
          "/dashboard",
          "/dashboard/absensi",
          "/dashboard/jadwal",
          "/dashboard/tugas",
          "/dashboard/pengumuman",
        ].includes(item.href);
      }
      // Ketua Kelas / Wakil Ketua / other pengurus
      const restrictedForKetua = [
        "/dashboard/pengguna",
        "/dashboard/audit-log",
        "/dashboard/nilai",
        "/dashboard/profil",
      ];
      return !restrictedForKetua.includes(item.href);
    }

    return item.href === "/dashboard";
  });

  return (
    <div className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-16 z-30">
      <nav
        className="container-portal flex gap-1.5 overflow-x-auto py-2.5 scrollbar-none"
        aria-label="Navigasi dashboard"
      >
        {visibleModules.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/15 text-accent-text font-semibold shadow-xs"
                  : "text-muted hover:bg-background hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
