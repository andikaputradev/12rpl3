import type * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3.5 py-2 text-sm text-foreground outline-none transition-[color,box-shadow] placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
