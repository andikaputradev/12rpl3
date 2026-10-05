import { ReportKopSurat } from "@/components/reports/report-kop-surat";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import type { KasSettings } from "@/lib/db/schema";
import { formatIndonesianDate } from "@/lib/utils";

interface KasReportProps {
  settings: KasSettings | null;
  waliKelasName?: string | null;
  bendaharaName?: string | null;
}

export function KasReport({
  settings,
  waliKelasName = "Wali Kelas XII RPL 3",
  bendaharaName = "Bendahara XII RPL 3",
}: KasReportProps) {
  const today = new Date();

  return (
    <div className="w-full text-black font-sans text-xs">
      <ReportKopSurat
        documentTitle="Laporan Informasi & Pengelolaan Kas Kelas"
        documentSubtitle="Tata Kelola Keuangan Mandiri Kelas XII RPL 3"
        documentNumber="421.3 / KAS-DIGITAL / XII-RPL3 / 2026"
      />

      {/* Metadata Dokumen */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 my-4 bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kelas</span>
            <span className="font-bold text-neutral-950">: XII RPL 3</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Kompetensi Keahlian</span>
            <span className="font-medium text-neutral-950">: Rekayasa Perangkat Lunak</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Tahun Ajaran</span>
            <span className="font-medium text-neutral-950">: 2026/2027</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Tanggal Terbit</span>
            <span className="font-medium text-neutral-950">: {formatIndonesianDate(today)}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Penanggung Jawab</span>
            <span className="font-medium text-neutral-950">: Bendahara Kelas & Wali Kelas</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-neutral-800">Status Saluran</span>
            <span className="font-bold text-emerald-800">: Resmi & Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Rincian Ketentuan Kas Digital */}
      <div className="border border-black p-4 my-4 bg-neutral-50/50">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-neutral-900 border-b border-black/30 pb-2">
          Ketentuan Iuran Kas & Saluran Pembayaran Resmi
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-black/40 p-3 bg-white rounded-xs space-y-2">
            <span className="block font-bold text-neutral-900 text-xs uppercase tracking-wide">
              Nominal Iuran Wajib Siswa
            </span>
            <p className="font-mono text-base font-bold text-emerald-800">
              {settings?.nominalInfo ?? "Rp 5.000 / minggu"}
            </p>
            <p className="text-[11px] text-neutral-600">
              Iuran dibayarkan secara rutin setiap pekan atau dirapel per bulan sesuai kesepakatan
              musyawarah kelas.
            </p>
          </div>

          <div className="border border-black/40 p-3 bg-white rounded-xs space-y-1.5">
            <span className="block font-bold text-neutral-900 text-xs uppercase tracking-wide">
              Rekening & Kanal Digital Resmi
            </span>
            <div className="text-[11px] space-y-1">
              <div>
                <span className="text-neutral-600">Kanal E-Wallet:</span>{" "}
                <strong className="text-neutral-950">DANA / QRIS Nasional</strong>
              </div>
              <div>
                <span className="text-neutral-600">Nomor Akun:</span>{" "}
                <strong className="font-mono text-neutral-950">
                  {settings?.danaNumber ?? "0857-xxxx-xxxx"}
                </strong>
              </div>
              <div>
                <span className="text-neutral-600">Atas Nama:</span>{" "}
                <strong className="text-neutral-950">
                  {settings?.danaAccountName ?? "Bendahara XII RPL 3"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Petunjuk & Tata Tertib Pembayaran */}
      <div className="border border-black p-4 my-4 bg-white">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900">
          Petunjuk Pembayaran & Verifikasi
        </h4>
        <div className="text-neutral-700 leading-relaxed text-[11px] space-y-1.5">
          <p>
            {settings?.instructions ??
              "Pembayaran kas dapat dilakukan secara tunai langsung kepada Bendahara Kelas atau non-tunai melalui transfer QRIS / E-Wallet DANA. Setiap kali melakukan transfer, wajib menyimpan dan mengirimkan bukti transfer kepada Bendahara Kelas untuk diverifikasi ke dalam buku besar."}
          </p>
          <ol className="list-decimal pl-4 space-y-1 mt-2">
            <li>
              Pembayaran non-tunai wajib menyertakan berita transfer dengan format:{" "}
              <em>KAS_[NAMA SISWA]_[MINGGU KE]</em>.
            </li>
            <li>
              Setelah transfer, kirimkan tangkapan layar bukti sukses ke grup WhatsApp resmi kelas
              atau langsung ke nomor Bendahara Kelas.
            </li>
            <li>
              Bendahara akan mencatat pelunasan pada buku catatan kas dan portal digital kelas.
            </li>
          </ol>
        </div>
      </div>

      {/* Alokasi Penggunaan Dana Kas */}
      <div className="border border-black p-4 my-4 bg-neutral-50/50">
        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-900">
          Alokasi & Transparansi Penggunaan Dana Kas
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="border border-black/30 p-2 bg-white rounded-xs">
            <span className="block font-semibold text-neutral-800">Kegiatan & Acara Kelas</span>
            <span className="text-[10px] text-neutral-600">
              Study tour, foto bersama, perpisahan
            </span>
          </div>
          <div className="border border-black/30 p-2 bg-white rounded-xs">
            <span className="block font-semibold text-neutral-800">Perlengkapan Kelas</span>
            <span className="text-[10px] text-neutral-600">
              Spidol, penghapus, alat kebersihan, dekorasi
            </span>
          </div>
          <div className="border border-black/30 p-2 bg-white rounded-xs">
            <span className="block font-semibold text-neutral-800">Dana Sosial & Kasih</span>
            <span className="text-[10px] text-neutral-600">
              Besuk teman/keluarga sakit, musibah
            </span>
          </div>
        </div>
      </div>

      {/* Lembar Pengesahan / Tanda Tangan */}
      <ReportSignatureBlock
        leftRole="Bendahara Kelas XII RPL 3"
        leftName={bendaharaName}
        leftIdLabel="NISN"
        leftIdValue="0069876543"
        rightRole="Wali Kelas XII RPL 3"
        rightName={waliKelasName}
        rightIdLabel="NIP"
        rightIdValue="19820514 200801 1 012"
      />
    </div>
  );
}
