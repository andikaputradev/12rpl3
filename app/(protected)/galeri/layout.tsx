import Link from "next/link";
import type * as React from "react";

const GALERI_PROTECTED_NAV = [
  { label: "Unggah Foto", href: "/galeri/upload" },
  { label: "Kiriman Saya", href: "/galeri/kiriman-saya" },
] as const;

export default function GaleriProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-portal py-12">
      <nav className="mb-8 flex gap-1" aria-label="Navigasi unggah galeri">
        {GALERI_PROTECTED_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
