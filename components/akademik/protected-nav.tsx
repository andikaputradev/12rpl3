"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { protectedModules } from "@/lib/config/site";
import { cn } from "@/lib/utils";

export function ProtectedNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-16 z-30">
      <nav
        className="container-portal flex gap-1.5 overflow-x-auto py-2.5 scrollbar-none"
        aria-label="Navigasi area siswa"
      >
        {protectedModules.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

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
