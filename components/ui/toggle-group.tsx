"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-transparent data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5",
        default: "h-9",
        lg: "h-11 px-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);

const ToggleGroupContext = createContext<VariantProps<typeof toggleGroupItemVariants>>({
  size: "default",
});

function ToggleGroup({
  className,
  variant: _variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupItemVariants> & { variant?: never }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex w-fit items-center gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupItemVariants>) {
  const context = useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleGroupItemVariants({ size: context.size ?? size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
