import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { navModules, siteConfig } from "@/lib/config/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-portal grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-display text-base font-semibold">{siteConfig.siteName}</p>
          <p className="max-w-xs text-sm text-muted">{siteConfig.tagline}</p>
          <p data-eyebrow>
            {siteConfig.schoolName} — {siteConfig.jurusan}
          </p>
        </div>

        <div className="space-y-3">
          <p data-eyebrow>Navigasi</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted">
            {navModules.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="cursor-pointer transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p data-eyebrow>Kontak Kelas</p>
          <p className="text-sm text-muted">
            Informasi kontak wali kelas dan tautan media sosial resmi akan ditampilkan setelah
            dikonfirmasi oleh pihak sekolah.
          </p>
          <Link
            href="/login"
            className="inline-block cursor-pointer text-sm text-accent-text underline-offset-4 hover:underline"
          >
            Masuk sebagai pengurus / wali kelas
          </Link>
        </div>
      </div>

      <Separator />

      <div className="container-portal flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
        <p>
          © {year} {siteConfig.className}, {siteConfig.schoolName}.
        </p>
        <p className="font-mono uppercase tracking-[0.1em]">Dibangun oleh siswa RPL</p>
      </div>
    </footer>
  );
}
