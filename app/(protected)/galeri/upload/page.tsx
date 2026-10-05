import type { Metadata } from "next";
import { UploadForm } from "@/components/galeri/upload-form";
import { getActiveAlbumsForUpload } from "@/lib/actions/galeri";

export const metadata: Metadata = {
  title: "Unggah Foto - Galeri",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GaleriUploadPage() {
  const albums = await getActiveAlbumsForUpload();

  return (
    <div>
      <header className="max-w-lg">
        <p data-eyebrow>Galeri</p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Unggah Foto atau Video
        </h1>
        <p className="mt-2 text-sm text-muted">
          Kiriman akan ditinjau oleh Pengurus/Wali Kelas sebelum tayang publik.
        </p>
      </header>

      <div className="mt-10">
        <UploadForm albums={albums} />
      </div>
    </div>
  );
}
