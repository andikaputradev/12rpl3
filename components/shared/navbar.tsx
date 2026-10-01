"use client";

import {
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navModules, siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface NavbarProps {
  isAuthenticated: boolean;
  userRole?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  wali_kelas: "Wali Kelas",
  pengurus: "Pengurus Kelas",
  siswa: "Siswa",
};

export function Navbar({ isAuthenticated, userRole }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isStaff =
    userRole === "super_admin" || userRole === "wali_kelas" || userRole === "pengurus";

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md"
    >
      <div className="container-portal flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight"
        >
          <span
            className="flex size-8 items-center justify-center rounded-md bg-accent font-mono text-xs text-accent-foreground"
            aria-hidden="true"
          >
            RPL
          </span>
          <span>{siteConfig.siteName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {navModules.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground",
                pathname === item.href && "bg-surface text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-2 border-border/80"
                >
                  {isStaff ? (
                    <>
                      <ShieldCheck className="size-4 text-accent-text" />
                      <span>Dashboard</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="size-4 text-accent-text" />
                      <span>Area Siswa</span>
                    </>
                  )}
                  <ChevronDown className="size-3.5 text-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {userRole && (
                  <>
                    <div className="px-2.5 py-1.5 text-xs text-muted">
                      Peran:{" "}
                      <span className="font-medium text-foreground">
                        {ROLE_LABELS[userRole] ?? userRole}
                      </span>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isStaff && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="size-4" />
                      <span>Dashboard Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/akademik/nilai" className="flex items-center gap-2 cursor-pointer">
                    <GraduationCap className="size-4" />
                    <span>Nilai & Akademik</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profil-saya" className="flex items-center gap-2 cursor-pointer">
                    <User className="size-4" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 text-destructive-text cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>Keluar</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu Portal</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 py-2" aria-label="Navigasi mobile">
                {navModules.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface",
                      pathname === item.href && "bg-surface font-medium text-accent-text",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      {isStaff && (
                        <Button asChild variant="default" className="w-full justify-start">
                          <Link href="/dashboard" onClick={() => setOpen(false)}>
                            <LayoutDashboard className="size-4 mr-2" />
                            Dashboard Admin
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/akademik/nilai" onClick={() => setOpen(false)}>
                          <GraduationCap className="size-4 mr-2" />
                          Area Siswa
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="/profil-saya" onClick={() => setOpen(false)}>
                          <User className="size-4 mr-2" />
                          Profil Saya
                        </Link>
                      </Button>
                      <form action={logoutAction} className="w-full">
                        <Button
                          type="submit"
                          variant="ghost"
                          className="w-full justify-start text-destructive-text hover:text-destructive-text hover:bg-destructive/10"
                        >
                          <LogOut className="size-4 mr-2" />
                          Keluar
                        </Button>
                      </form>
                    </>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        Masuk ke Portal
                      </Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
