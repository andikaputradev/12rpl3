"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(() => setTheme(newTheme));
      return;
    }
    setTheme(newTheme);
  }

  if (!mounted) {
    return <div className="size-10 rounded-md" aria-hidden="true" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Pilih tema tampilan"
          className="size-10"
        >
          {resolvedTheme === "dark" ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Sun className="size-4" />
            <span>Terang</span>
          </div>
          {theme === "light" && <Check className="size-4 text-accent-text" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Moon className="size-4" />
            <span>Gelap</span>
          </div>
          {theme === "dark" && <Check className="size-4 text-accent-text" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Laptop className="size-4" />
            <span>Sistem</span>
          </div>
          {theme === "system" && <Check className="size-4 text-accent-text" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
