import type { Metadata } from "next";
import { OrgStructureCard } from "@/components/shared/org-structure-card";
import { StatCounter } from "@/components/shared/stat-counter";
import { StatRatioBar } from "@/components/shared/stat-ratio-bar";
import { WaliKelasCard } from "@/components/shared/wali-kelas-card";
import {
  getClassProfile,
  getOrganizationalStructure,
  getStudentStats,
  getWaliKelas,
} from "@/lib/actions/beranda";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const classProfile = await getClassProfile();
  return {
    title: `Profil Kelas | ${siteConfig.className} ${siteConfig.schoolName}`,
    description:
      classProfile?.sejarah?.slice(0, 155) ??
      `Sejarah, visi misi, dan struktur organisasi ${siteConfig.className}.`,
    alternates: { canonical: "/profil" },
  };
}

export default async function ProfilKelasPage() {
  const [classProfile, waliKelas, pengurus, stats] = await Promise.all([
    getClassProfile(),
    getWaliKelas(),
    getOrganizationalStructure(),
    getStudentStats(),
  ]);

  const ketua =
    pengurus.find(
      (p) =>
        (p.jabatan ?? "").toLowerCase().includes("ketua") &&
        !(p.jabatan ?? "").toLowerCase().includes("wakil"),
    ) ?? pengurus.find((p) => p.fullName.toLowerCase().includes("wahyu andika"));

  const wakilKetua =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("wakil")) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("zaeni"));

  const sekretaris1 =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("sekretaris 1")) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("samrotul"));

  const sekretaris2 =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("sekretaris 2")) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("qori"));

  const bendahara1 =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("bendahara 1")) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("sifa auliya"));

  const bendahara2 =
    pengurus.find((p) => (p.jabatan ?? "").toLowerCase().includes("bendahara 2")) ??
    pengurus.find((p) => p.fullName.toLowerCase().includes("royana"));

  const coreOfficerIds = new Set(
    [ketua, wakilKetua, sekretaris1, sekretaris2, bendahara1, bendahara2]
      .filter(Boolean)
      .map((p) => p?.id),
  );
  const seksiSeksi = pengurus.filter((p) => !coreOfficerIds.has(p.id));

  return (
    <div className="container-portal py-20">
      <header className="max-w-2xl">
        <p data-eyebrow>Profil Kelas</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Profil Kelas {siteConfig.className}
        </h1>
        {classProfile?.motto ? <p className="mt-3 text-muted">{classProfile.motto}</p> : null}
      </header>

      {classProfile?.sejarah ? (
        <section className="mt-16 max-w-[65ch]">
          <h2 className="font-display text-xl font-medium tracking-tight">Sejarah</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">
            {classProfile.sejarah}
          </p>
        </section>
      ) : null}

      {classProfile?.visi || classProfile?.misi?.length ? (
        <section className="mt-16 grid gap-10 sm:grid-cols-2">
          {classProfile.visi ? (
            <div>
              <h2 className="font-display text-xl font-medium tracking-tight">Visi</h2>
              <blockquote className="mt-4 border-l-2 border-accent pl-4 text-lg italic leading-relaxed text-foreground">
                “{classProfile.visi}”
              </blockquote>
            </div>
          ) : null}

          {classProfile?.misi?.length ? (
            <div>
              <h2 className="font-display text-xl font-medium tracking-tight">Misi</h2>
              <ol className="mt-4 flex flex-col gap-2.5 text-muted">
                {classProfile.misi.map((point, i) => (
                  <li key={point} className="flex gap-3">
                    <span className="font-mono text-sm text-accent-text">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-20">
        <header className="max-w-xl">
          <p data-eyebrow>Kepengurusan</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Struktur Organisasi Kelas
          </h2>
          <p className="mt-2 text-sm text-muted">
            Bagan kepemimpinan, perwalian, dan tata kelola kelas {siteConfig.className}.
          </p>
        </header>

        <div className="mt-12 flex flex-col items-center">
          {/* Pembina / Wali Kelas */}
          {waliKelas ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs">
                <WaliKelasCard waliKelas={waliKelas} />
              </div>
              <div className="my-3 h-8 w-px bg-border" aria-hidden="true" />
            </div>
          ) : null}

          {/* Ketua & Wakil Ketua */}
          <div className="flex flex-col items-center w-full">
            <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
              <OrgStructureCard profile={ketua ?? null} fallbackLabel="Ketua Kelas" tier={1} />
              <OrgStructureCard profile={wakilKetua ?? null} fallbackLabel="Wakil Ketua" tier={2} />
            </div>
            <div className="my-3 h-8 w-px bg-border" aria-hidden="true" />
          </div>

          {/* Sekretariat & Kebendaharaan */}
          <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Sekretariat */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface/30 p-4">
              <div className="border-b border-border/60 pb-2 text-center">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                  Sekretariat
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <OrgStructureCard
                  profile={sekretaris1 ?? null}
                  fallbackLabel="Sekretaris 1"
                  tier={3}
                />
                <OrgStructureCard
                  profile={sekretaris2 ?? null}
                  fallbackLabel="Sekretaris 2"
                  tier={3}
                />
              </div>
            </div>

            {/* Kebendaharaan */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface/30 p-4">
              <div className="border-b border-border/60 pb-2 text-center">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                  Kebendaharaan
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <OrgStructureCard
                  profile={bendahara1 ?? null}
                  fallbackLabel="Bendahara 1"
                  tier={3}
                />
                <OrgStructureCard
                  profile={bendahara2 ?? null}
                  fallbackLabel="Bendahara 2"
                  tier={3}
                />
              </div>
            </div>
          </div>

          {/* Seksi Lainnya (bila ada) */}
          {seksiSeksi.length > 0 ? (
            <div className="mt-10 w-full max-w-4xl">
              <div className="mb-4 text-center">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  Seksi Bidang & Divisi
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {seksiSeksi.map((p) => (
                  <OrgStructureCard key={p.id} profile={p} fallbackLabel="Seksi" tier={3} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-20">
        <p data-eyebrow>Statistik Kelas</p>
        <div className="mt-6 grid grid-cols-3 gap-6 sm:max-w-xl">
          <StatCounter value={stats.total} label="Total Siswa" />
          <StatCounter value={stats.laki} label="Laki-laki" />
          <StatCounter value={stats.perempuan} label="Perempuan" />
        </div>
        <div className="mt-8 max-w-xl">
          <StatRatioBar laki={stats.laki} perempuan={stats.perempuan} />
        </div>
      </section>
    </div>
  );
}
