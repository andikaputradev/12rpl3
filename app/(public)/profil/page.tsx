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
import type { Profile } from "@/lib/db/schema";

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

function findByJabatan(
  pengurus: Profile[],
  patterns: string[],
  exclude: string[] = [],
): Profile | undefined {
  return pengurus.find((p) => {
    const jabatan = (p.jabatan ?? "").toLowerCase();
    const matches = patterns.some((pattern) => jabatan.includes(pattern));
    const excluded = exclude.some((pattern) => jabatan.includes(pattern));
    return matches && !excluded;
  });
}

export default async function ProfilKelasPage() {
  const [classProfile, waliKelas, pengurus, stats] = await Promise.all([
    getClassProfile(),
    getWaliKelas(),
    getOrganizationalStructure(),
    getStudentStats(),
  ]);

  const ketua = findByJabatan(pengurus, ["ketua"], ["wakil"]);
  const wakilKetua = findByJabatan(pengurus, ["wakil ketua", "wakil"]);
  const sekretaris = findByJabatan(pengurus, ["sekretaris"]);
  const bendahara = findByJabatan(pengurus, ["bendahara"]);
  const tierOneIds = new Set(
    [ketua, wakilKetua, sekretaris, bendahara].filter(Boolean).map((p) => p?.id),
  );
  const seksiSeksi = pengurus.filter((p) => !tierOneIds.has(p.id));

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

          {classProfile.misi?.length ? (
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

      {waliKelas ? (
        <section className="mt-16 max-w-xs">
          <h2 className="sr-only">Wali Kelas</h2>
          <WaliKelasCard waliKelas={waliKelas} />
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-xl font-medium tracking-tight">Struktur Organisasi</h2>

        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="w-full max-w-[220px]">
            <OrgStructureCard profile={ketua ?? null} fallbackLabel="Ketua Kelas" tier={1} />
          </div>

          <div className="w-full max-w-[200px]">
            <OrgStructureCard profile={wakilKetua ?? null} fallbackLabel="Wakil Ketua" tier={2} />
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            <OrgStructureCard profile={sekretaris ?? null} fallbackLabel="Sekretaris" tier={3} />
            <OrgStructureCard profile={bendahara ?? null} fallbackLabel="Bendahara" tier={3} />
          </div>

          {seksiSeksi.length > 0 ? (
            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {seksiSeksi.map((p) => (
                <OrgStructureCard key={p.id} profile={p} fallbackLabel="Seksi" tier={3} />
              ))}
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
