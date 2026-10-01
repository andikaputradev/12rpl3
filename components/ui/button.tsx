import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // biome-ignore lint/security/noSecrets: string utility class Tailwind, bukan kredensial.
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-tight transition-[color,background-color,border-color,box-shadow,transform] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:opacity-90",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface",
        ghost: "text-foreground hover:bg-surface",
        link: "text-accent-text underline-offset-4 hover:underline",
        destructive: "bg-destructive text-white hover:opacity-90",
      },
      size: {
        default: "h-11 min-w-11 px-5 py-2",
        sm: "h-9 min-w-9 rounded-md px-4",
        lg: "h-12 min-w-12 rounded-md px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
