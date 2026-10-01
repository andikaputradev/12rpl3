import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent/15 text-accent-text",
        outline: "border-border text-muted",
        success: "border-transparent bg-success/15 text-success-text",
        destructive: "border-transparent bg-destructive/15 text-destructive-text",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
