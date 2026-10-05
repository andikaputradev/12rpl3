import Image from "next/image";
import { siteConfig } from "@/lib/config/site";

interface ReportKopSuratProps {
  documentTitle: string;
  documentSubtitle?: string;
  documentNumber?: string;
}

export function ReportKopSurat({
  documentTitle,
  documentSubtitle,
  documentNumber,
}: ReportKopSuratProps) {
  return (
    <div className="w-full text-black">
      {/* Header Kop Surat Standar Sekolah */}
      <div className="flex items-center justify-between gap-4 pb-3">
        {/* Logo / Lambang Sekolah Kiri */}
        <div className="flex size-20 shrink-0 items-center justify-center">
          <Image
            src="/img/sekolah.png"
            alt="Logo Sekolah"
            width={80}
            height={80}
            unoptimized
            priority
            className="size-20 object-contain"
          />
        </div>

        <div className="flex-1 text-center">
          <p className="font-semibold text-xs tracking-wider uppercase text-neutral-800">
            Pemerintah Provinsi Jawa Tengah
          </p>
          <p className="font-semibold text-xs tracking-wider uppercase text-neutral-800">
            Dinas Pendidikan dan Kebudayaan
          </p>
          <h2 className="font-bold text-base sm:text-lg tracking-wide uppercase text-neutral-950">
            {siteConfig.schoolName}
          </h2>
          <p className="font-semibold text-xs tracking-wide uppercase text-neutral-900">
            Kompetensi Keahlian {siteConfig.jurusan}
          </p>
          <p className="font-normal text-[10px] text-neutral-700 leading-tight mt-0.5">
            Jl. Veteran No. 38, Sukoharjo, Jawa Tengah 57511 | Telp: (0271) 593125 | Pos-el:
            rpl@smkn1sukoharjo.sch.id
          </p>
        </div>

        {/* Logo / Lambang Kelas Kanan */}
        <div className="flex size-20 shrink-0 items-center justify-center">
          <Image
            src="/img/logo.png"
            alt="Logo Kelas"
            width={80}
            height={80}
            unoptimized
            priority
            className="size-20 object-contain"
          />
        </div>
      </div>

      {/* Garis Ganda Kop Surat Dinas (Tebal & Tipis) */}
      <div className="border-b-[3px] border-black" />
      <div className="border-b border-black mt-0.5 mb-5" />

      {/* Judul Dokumen */}
      <div className="text-center my-3">
        <h3 className="font-bold text-base sm:text-lg tracking-wider uppercase underline underline-offset-4 text-neutral-950">
          {documentTitle}
        </h3>
        {documentSubtitle && (
          <p className="text-xs font-semibold text-neutral-700 mt-1 uppercase tracking-wide">
            {documentSubtitle}
          </p>
        )}
        {documentNumber && (
          <p className="font-mono text-[11px] text-neutral-600 mt-0.5">Nomor: {documentNumber}</p>
        )}
      </div>
    </div>
  );
}
