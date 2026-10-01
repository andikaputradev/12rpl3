import type * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-[color,box-shadow] placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
