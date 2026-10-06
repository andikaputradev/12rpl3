"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Home,
  Images,
  KeyRound,
  Laptop,
  LayoutDashboard,
  LogIn,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  Printer,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  Vote,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
import { siteConfig } from "@/lib/config/site";
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

const MAIN_NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/profil", label: "Profil Kelas", icon: Sparkles },
  { href: "/direktori", label: "Direktori Siswa", icon: Users },
  { href: "/jadwal", label: "Jadwal & Agenda", icon: CalendarDays },
  { href: "/galeri", label: "Galeri", icon: Images },
  { href: "/prestasi", label: "Prestasi", icon: Award },
  { href: "/blog", label: "Blog", icon: BookOpen },
] as const;

const COMMUNITY_NAV_ITEMS = [
  { href: "/interaksi/buku-tamu", label: "Buku Tamu", icon: MessageSquare },
  { href: "/interaksi/aspirasi", label: "Papan Aspirasi", icon: Megaphone },
  { href: "/interaksi/polling", label: "Polling Kelas", icon: Vote },
  { href: "/kelulusan", label: "Corner Kelulusan", icon: GraduationCap },
] as const;

export function Navbar({ isAuthenticated, userRole }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => setTheme(newTheme));
      return;
    }
    setTheme(newTheme);
  }

  const isStaff =
    userRole === "super_admin" || userRole === "wali_kelas" || userRole === "pengurus";

  function isLinkActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
          prefetch={false}
          className="flex items-center gap-2.5 font-display text-sm font-semibold tracking-tight transition-opacity hover:opacity-90"
        >
          <Image
            src="/img/logo.png"
            alt="Logo XII RPL 3"
            width={32}
            height={32}
            className="size-8 rounded-md object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="leading-none">{siteConfig.siteName}</span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-muted font-normal mt-0.5">
              {siteConfig.className}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center lg:gap-0.5 xl:gap-1.5 lg:flex"
          aria-label="Navigasi utama"
        >
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "cursor-pointer rounded-md px-2 xl:px-2.5 py-1.5 text-xs xl:text-sm text-muted transition-colors hover:bg-surface hover:text-foreground",
                  active && "bg-surface font-medium text-foreground shadow-2xs",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 cursor-pointer rounded-md px-2 xl:px-2.5 py-1.5 text-xs xl:text-sm text-muted transition-colors hover:bg-surface hover:text-foreground",
                  pathname.startsWith("/interaksi") &&
                    "bg-surface font-medium text-foreground shadow-2xs",
                )}
              >
                <span>Interaksi</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {COMMUNITY_NAV_ITEMS.filter((item) => item.href !== "/kelulusan").map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} prefetch={false} className="cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/kelulusan"
            prefetch={false}
            className={cn(
              "cursor-pointer rounded-md px-2 xl:px-2.5 py-1.5 text-xs xl:text-sm text-muted transition-colors hover:bg-surface hover:text-foreground",
              pathname.startsWith("/kelulusan") &&
                "bg-surface font-medium text-foreground shadow-2xs",
            )}
          >
            Kelulusan
          </Link>
        </nav>

        {/* Right side controls */}
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
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        prefetch={false}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="size-4" />
                        <span>Dashboard Admin</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/laporan"
                        prefetch={false}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="size-4" />
                        <span>Cetak Laporan</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href="/akademik/nilai"
                    prefetch={false}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <GraduationCap className="size-4" />
                    <span>Nilai & Akademik</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profil-saya"
                    prefetch={false}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="size-4" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/ganti-password"
                    prefetch={false}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="size-4" />
                    <span>Ganti Kata Sandi</span>
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
              <Link href="/login" prefetch={false}>
                Masuk
              </Link>
            </Button>
          )}

          {/* Mobile Menu Drawer */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              {/* Drawer Header */}
              <SheetHeader>
                <div className="flex items-center gap-2.5 pr-8">
                  <Image
                    src="/img/logo.png"
                    alt="Logo XII RPL 3"
                    width={32}
                    height={32}
                    className="size-8 rounded-md object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <SheetTitle>{siteConfig.siteName}</SheetTitle>
                    <p className="font-mono text-[11px] text-muted truncate">
                      {siteConfig.className} · {siteConfig.jurusan}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              {/* Scrollable Navigation Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5 touch-pan-y focus:outline-none">
                {/* User Status Card (when logged in) */}
                {isAuthenticated && (
                  <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-text font-mono text-xs font-semibold">
                          {userRole ? userRole.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {ROLE_LABELS[userRole ?? ""] ?? "Pengguna"}
                          </p>
                          <p className="text-[11px] text-muted truncate">Sesi login aktif</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success-text shrink-0">
                        Online
                      </span>
                    </div>
                  </div>
                )}

                {/* Section: Menu Utama */}
                <div className="space-y-1">
                  <p className="px-2.5 pb-1 text-[11px] font-mono uppercase tracking-wider text-muted">
                    Menu Utama
                  </p>
                  <nav className="flex flex-col gap-0.5" aria-label="Menu Utama">
                    {MAIN_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = isLinkActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.99]",
                            active
                              ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                              : "text-muted hover:bg-surface hover:text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={cn(
                                "size-4 shrink-0 transition-colors",
                                active
                                  ? "text-accent-text"
                                  : "text-muted group-hover:text-foreground",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && <span className="size-1.5 rounded-full bg-accent shrink-0" />}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Section: Interaksi & Komunitas */}
                <div className="space-y-1">
                  <p className="px-2.5 pb-1 text-[11px] font-mono uppercase tracking-wider text-muted">
                    Interaksi & Komunitas
                  </p>
                  <nav className="flex flex-col gap-0.5" aria-label="Interaksi Komunitas">
                    {COMMUNITY_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = isLinkActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.99]",
                            active
                              ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                              : "text-muted hover:bg-surface hover:text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={cn(
                                "size-4 shrink-0 transition-colors",
                                active
                                  ? "text-accent-text"
                                  : "text-muted group-hover:text-foreground",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && <span className="size-1.5 rounded-full bg-accent shrink-0" />}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Section: Portal Pengguna / Admin (If Authenticated) */}
                {isAuthenticated && (
                  <div className="space-y-1">
                    <p className="px-2.5 pb-1 text-[11px] font-mono uppercase tracking-wider text-muted">
                      Portal & Akun
                    </p>
                    <nav className="flex flex-col gap-0.5" aria-label="Portal Pengguna">
                      {isStaff && (
                        <>
                          <Link
                            href="/dashboard"
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                              isLinkActive("/dashboard")
                                ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                                : "text-muted hover:bg-surface hover:text-foreground",
                            )}
                          >
                            <LayoutDashboard className="size-4 shrink-0" />
                            <span>Dashboard Admin</span>
                          </Link>
                          <Link
                            href="/dashboard/laporan"
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                              isLinkActive("/dashboard/laporan")
                                ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                                : "text-muted hover:bg-surface hover:text-foreground",
                            )}
                          >
                            <Printer className="size-4 shrink-0" />
                            <span>Cetak Laporan</span>
                          </Link>
                        </>
                      )}

                      <Link
                        href="/akademik/nilai"
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isLinkActive("/akademik/nilai")
                            ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                            : "text-muted hover:bg-surface hover:text-foreground",
                        )}
                      >
                        <GraduationCap className="size-4 shrink-0" />
                        <span>Nilai & Akademik</span>
                      </Link>

                      <Link
                        href="/profil-saya"
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isLinkActive("/profil-saya")
                            ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                            : "text-muted hover:bg-surface hover:text-foreground",
                        )}
                      >
                        <User className="size-4 shrink-0" />
                        <span>Profil Saya</span>
                      </Link>

                      <Link
                        href="/ganti-password"
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isLinkActive("/ganti-password")
                            ? "bg-accent/15 text-accent-text font-semibold shadow-2xs"
                            : "text-muted hover:bg-surface hover:text-foreground",
                        )}
                      >
                        <KeyRound className="size-4 shrink-0" />
                        <span>Ganti Kata Sandi</span>
                      </Link>
                    </nav>
                  </div>
                )}

                {/* Section: Authentication CTA */}
                <div className="pt-2">
                  {isAuthenticated ? (
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive-text transition-colors hover:bg-destructive/15 active:scale-[0.98]"
                      >
                        <LogOut className="size-4" />
                        <span>Keluar dari Akun</span>
                      </button>
                    </form>
                  ) : (
                    <Button asChild className="w-full min-h-[44px] justify-center gap-2">
                      <Link href="/login" prefetch={false} onClick={() => setOpen(false)}>
                        <LogIn className="size-4" />
                        <span>Masuk ke Portal</span>
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Section: Mobile Theme Switcher */}
                {mounted && (
                  <div className="pt-3 border-t border-border/60">
                    <p className="mb-2 px-1 text-[11px] font-mono uppercase tracking-wider text-muted">
                      Tema Tampilan
                    </p>
                    <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/80 bg-background/60 p-1">
                      <button
                        type="button"
                        onClick={() => handleThemeChange("light")}
                        className={cn(
                          "flex min-h-[38px] items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                          theme === "light"
                            ? "bg-surface text-foreground shadow-2xs font-semibold"
                            : "text-muted hover:text-foreground",
                        )}
                      >
                        <Sun className="size-3.5" />
                        <span>Terang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeChange("dark")}
                        className={cn(
                          "flex min-h-[38px] items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                          theme === "dark"
                            ? "bg-surface text-foreground shadow-2xs font-semibold"
                            : "text-muted hover:text-foreground",
                        )}
                      >
                        <Moon className="size-3.5" />
                        <span>Gelap</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeChange("system")}
                        className={cn(
                          "flex min-h-[38px] items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                          theme === "system"
                            ? "bg-surface text-foreground shadow-2xs font-semibold"
                            : "text-muted hover:text-foreground",
                        )}
                      >
                        <Laptop className="size-3.5" />
                        <span>Sistem</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Small Footer Signature */}
                <div className="pt-2 text-center">
                  <p className="font-mono text-[10px] text-muted">
                    {siteConfig.className} · {siteConfig.schoolName}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
