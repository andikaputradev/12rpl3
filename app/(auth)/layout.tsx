import Link from "next/link";
import type * as React from "react";
import { siteConfig } from "@/lib/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-5 py-16">
      <Link
        href="/"
        prefetch={false}
        className="flex items-center gap-2 font-display text-sm font-semibold"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-accent font-mono text-xs text-accent-foreground">
          RPL
        </span>
        {siteConfig.siteName}
      </Link>
      {children}
    </div>
  );
}
