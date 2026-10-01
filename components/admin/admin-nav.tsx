"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminModules } from "@/lib/config/site";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-16 z-30">
      <nav
        className="container-portal flex gap-1.5 overflow-x-auto py-2.5 scrollbar-none"
        aria-label="Navigasi dashboard"
      >
        {adminModules.map((item) => {
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
