"use client";

import { ArrowRight, Camera, CheckCircle2, Loader2, Save, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMyProfile } from "@/lib/actions/profil-saya-mutations";
import type { Profile } from "@/lib/db/schema";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

interface ProfilSayaFormProps {
  profile: Profile;
}

const initialState = { error: undefined, success: undefined, timestamp: undefined };

export function ProfilSayaForm({ profile }: ProfilSayaFormProps) {
  const [state, formAction, isPending] = useActionState(updateMyProfile, initialState);

  const rawProfile = profile as Record<string, unknown>;
  const rawFullName = String(profile?.fullName ?? rawProfile?.full_name ?? "");
  const rawAvatarUrl = (profile?.avatarUrl ?? rawProfile?.avatar_url ?? null) as string | null;
  const rawYearbookPhotoUrl = (profile?.yearbookPhotoUrl ??
    rawProfile?.yearbook_photo_url ??
    null) as string | null;
  const rawBio = String(profile?.bio ?? rawProfile?.bio ?? "");
  const rawCitaCita = String(profile?.citaCita ?? rawProfile?.cita_cita ?? "");
  const rawPublicContact = String(profile?.publicContact ?? rawProfile?.public_contact ?? "");
  const rawYearbookQuote = String(profile?.yearbookQuote ?? rawProfile?.yearbook_quote ?? "");
  const rawSocialLinks = (profile?.socialLinks ?? rawProfile?.social_links ?? {}) as Record<
    string,
    string
  >;
  const displayAbsenNumber = (profile?.absenNumber ?? rawProfile?.absen_number ?? null) as
    | number
    | null;

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const yearbookInputRef = useRef<HTMLInputElement>(null);

  // Avatar & Yearbook initial previews
  const initialCustomAvatar =
    rawAvatarUrl && !rawAvatarUrl.includes("pngtree")
      ? rawAvatarUrl
      : rawYearbookPhotoUrl && !rawYearbookPhotoUrl.includes("pngtree")
        ? rawYearbookPhotoUrl
        : null;

  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialCustomAvatar);
  const [yearbookPreview, setYearbookPreview] = useState<string | null>(
    rawYearbookPhotoUrl ?? initialCustomAvatar,
  );

  const [syncYearbook, setSyncYearbook] = useState<boolean>(
    !rawYearbookPhotoUrl || rawYearbookPhotoUrl === rawAvatarUrl,
  );

  // Live fields for real-time card preview
  const [fullName, setFullName] = useState<string>(rawFullName);
  const [bio, setBio] = useState<string>(rawBio);
  const [yearbookQuote, setYearbookQuote] = useState<string>(rawYearbookQuote);

  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Profil berhasil diperbarui dan disinkronkan ke Beranda!");
      setLastSavedTime(Date.now());
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    if (syncYearbook) {
      setYearbookPreview(objectUrl);
    }
  }

  function handleYearbookChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setYearbookPreview(objectUrl);
    setSyncYearbook(false);
  }

  return (
    <form action={formAction} className="space-y-10">
      {/* Notifikasi Berhasil Disimpan */}
      {lastSavedTime ? (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">
                Perubahan profil tersimpan dengan sukses!
              </p>
              <p className="text-xs text-muted">
                Foto dan informasi terbarumu langsung aktif di Beranda dan Direktori Kelas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Link href="/" prefetch={false}>
                <span>Lihat di Beranda</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* 1. BAGIAN FOTO: FOTO PROFIL UTAMA & FOTO YEARBOOK */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
            Foto Profil & Tampilan Visual
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Atur foto profil yang akan dilihat teman-teman di Beranda, Direktori, dan Buku Tamu.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* A. Foto Profil Utama */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/40">
            <div className="flex items-start gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-accent/40 bg-surface shadow-xs">
                {avatarPreview ? (
                  <Image
                    src={
                      avatarPreview.startsWith("blob:")
                        ? avatarPreview
                        : cloudinaryOptimized(avatarPreview, "f_auto,q_auto,w_192,h_192,c_fill")
                    }
                    alt="Pratinjau foto profil"
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized={avatarPreview.startsWith("blob:")}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-display text-2xl font-medium text-muted">
                    {getInitials(fullName) || "S"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-semibold text-foreground">
                    Foto Profil Utama
                  </span>
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-semibold text-accent-text">
                    Beranda & Direktori
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Foto ini tampil di kartu anggota Beranda, Direktori Siswa, dan Navigasi.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={avatarInputRef}
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="size-3.5" aria-hidden="true" />
                    Pilih Foto Baru
                  </Button>
                </div>
              </div>
            </div>

            {/* Opsi sinkronisasi ke foto yearbook */}
            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="syncYearbook"
                  name="syncYearbook"
                  checked={syncYearbook}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    setSyncYearbook(isChecked);
                    if (isChecked && avatarPreview) {
                      setYearbookPreview(avatarPreview);
                    }
                  }}
                />
                <Label
                  htmlFor="syncYearbook"
                  className="cursor-pointer font-normal text-xs text-muted hover:text-foreground"
                >
                  Gunakan foto ini juga untuk foto yearbook kelulusan
                </Label>
              </div>
            </div>
          </div>

          {/* B. Foto Yearbook (Kelulusan) */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/40">
            <div className="flex items-start gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
                {yearbookPreview ? (
                  <Image
                    src={
                      yearbookPreview.startsWith("blob:")
                        ? yearbookPreview
                        : cloudinaryOptimized(yearbookPreview, "f_auto,q_auto,w_192,h_192,c_fill")
                    }
                    alt="Pratinjau foto yearbook"
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized={yearbookPreview.startsWith("blob:")}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-display text-2xl font-medium text-muted">
                    {getInitials(fullName) || "S"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-semibold text-foreground">
                    Foto Yearbook
                  </span>
                  <span className="rounded-full bg-surface border border-border px-1.5 py-0.2 text-[10px] font-medium text-muted">
                    Kelulusan
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Foto wisuda/buku tahunan di halaman Corner Kelulusan. Boleh berbeda dari foto
                  profil harian.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={yearbookInputRef}
                    id="yearbookPhoto"
                    name="yearbookPhoto"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleYearbookChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => yearbookInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" aria-hidden="true" />
                    Pilih Foto Khusus
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="text-[11px] text-muted">
                {syncYearbook
                  ? "✓ Disinkronkan otomatis mengikuti Foto Profil Utama."
                  : "Foto yearbook khusus telah dipilih."}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted">
          Format yang didukung: JPEG, PNG, atau WebP. Maksimal ukuran berkas 5MB. Foto akan
          dioptimalkan secara otomatis untuk kecepatan muat.
        </p>
      </section>

      {/* 2. BAGIAN DATA DIRI & INFORMASI PRIBADI */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
            Data Diri & Identitas
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Identitas yang diperlihatkan kepada pengunjung dan rekan sekelas di portal.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={rawFullName}
              maxLength={100}
              required
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap kamu..."
            />
            <p className="text-xs text-muted">
              Nama ini yang ditampilkan di kartu profil Beranda dan direktori siswa.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="citaCita">Cita-Cita / Impian Karir</Label>
              <Input
                id="citaCita"
                name="citaCita"
                maxLength={150}
                defaultValue={rawCitaCita}
                placeholder="Misal: Full-Stack Engineer, AI Specialist"
              />
              <p className="text-xs text-muted">Akan ditampilkan pada kutipan kartu profil.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publicContact">Kontak Publik / Koordinasi (Opsional)</Label>
              <Input
                id="publicContact"
                name="publicContact"
                maxLength={100}
                defaultValue={rawPublicContact}
                placeholder="Email atau No. WhatsApp..."
              />
              <p className="text-xs text-muted">
                Bisa digunakan untuk komunikasi tugas dan kegiatan kelas.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio Singkat</Label>
              <span className="font-mono text-[11px] text-muted">{bio.length}/500</span>
            </div>
            <Textarea
              id="bio"
              name="bio"
              maxLength={500}
              rows={3}
              defaultValue={rawBio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan sedikit tentang dirimu, minat programming, atau hobi..."
            />
          </div>
        </div>
      </section>

      {/* 3. BAGIAN TAUTAN MEDIA SOSIAL & PORTOFOLIO */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
            Tautan Media Sosial & Portofolio
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Tautkan akun media sosial dan profil coding-mu agar teman sekelas dapat terhubung.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                maxLength={100}
                defaultValue={rawSocialLinks?.instagram ?? ""}
                placeholder="@username atau link profil"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                name="tiktok"
                maxLength={100}
                defaultValue={rawSocialLinks?.tiktok ?? ""}
                placeholder="@username atau link profil"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                name="github"
                maxLength={100}
                defaultValue={rawSocialLinks?.github ?? ""}
                placeholder="username atau link github"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                name="linkedin"
                maxLength={100}
                defaultValue={rawSocialLinks?.linkedin ?? ""}
                placeholder="username atau link linkedin"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="website">Website / Portofolio Pribadi</Label>
              <Input
                id="website"
                name="website"
                maxLength={150}
                defaultValue={rawSocialLinks?.website ?? ""}
                placeholder="https://portofolio-kamu.com"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. BAGIAN CORNER KELULUSAN & KUTIPAN KENANGAN */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
            Kutipan Kenangan Yearbook
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Pesan dan kesan yang akan diabadikan di buku kenangan kelulusan angkatan XII RPL 3.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="yearbookQuote">Kutipan Yearbook (Quote)</Label>
            <span className="font-mono text-[11px] text-muted">{yearbookQuote.length}/280</span>
          </div>
          <Textarea
            id="yearbookQuote"
            name="yearbookQuote"
            maxLength={280}
            rows={3}
            defaultValue={rawYearbookQuote}
            onChange={(e) => setYearbookQuote(e.target.value)}
            placeholder="Tuliskan kata mutiara, pesan kesan kocak, atau kenangan paling berkesan selama sekolah..."
          />
        </div>
      </section>

      {/* 5. PRATINJAU LANGSUNG KARTU BERANDA */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
            Pratinjau Kartu di Beranda
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Beginilah tampilan profilmu bagi orang lain yang melihat daftar siswa di Beranda.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className="relative size-[150px] overflow-hidden rounded-full border border-border bg-surface ring-2 ring-accent ring-offset-2 ring-offset-background">
              {avatarPreview ? (
                <Image
                  src={
                    avatarPreview.startsWith("blob:")
                      ? avatarPreview
                      : cloudinaryOptimized(avatarPreview, "f_auto,q_auto,w_150,h_150,c_fill")
                  }
                  alt={`Foto ${fullName}`}
                  fill
                  sizes="150px"
                  className="object-cover"
                  unoptimized={avatarPreview.startsWith("blob:")}
                />
              ) : (
                <div className="flex size-full items-center justify-center font-display text-2xl font-medium text-muted">
                  {getInitials(fullName) || "S"}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">{fullName || "Nama Siswa"}</p>
              <div className="mt-0.5 flex items-center justify-center gap-1.5">
                {displayAbsenNumber ? (
                  <span className="font-mono text-muted text-xs">No. {displayAbsenNumber}</span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-semibold text-accent-text">
                  Kamu
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOMBOL AKSI SIMPAN */}
      <div className="sticky bottom-4 z-20 flex items-center justify-end rounded-xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-md">
        <Button type="submit" size="default" disabled={isPending} className="gap-2 px-6">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Menyimpan & Mengunggah...</span>
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden="true" />
              <span>Simpan Perubahan</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
