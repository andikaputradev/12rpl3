"use client";

import { Loader2, Save, Upload } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMyProfile } from "@/lib/actions/profil-saya-mutations";
import type { Profile } from "@/lib/db/schema";
import { cloudinaryOptimized } from "@/lib/utils";

interface ProfilSayaFormProps {
  profile: Profile;
}

const initialState = { error: undefined, success: undefined, timestamp: undefined };

export function ProfilSayaForm({ profile }: ProfilSayaFormProps) {
  const [state, formAction, isPending] = useActionState(updateMyProfile, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    profile.yearbookPhotoUrl ?? profile.avatarUrl,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Profil tersimpan.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted/20">
          {preview ? (
            <Image
              src={
                preview.startsWith("blob:")
                  ? preview
                  : cloudinaryOptimized(preview, "f_auto,q_auto,w_160,h_160,c_fill")
              }
              alt="Pratinjau foto yearbook"
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : null}
        </div>
        <div>
          <Label htmlFor="yearbookPhoto" className="mb-1.5 block">
            Foto Yearbook
          </Label>
          <input
            ref={fileInputRef}
            id="yearbookPhoto"
            name="yearbookPhoto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Ganti Foto
          </Button>
          <p className="mt-1 text-muted text-xs">Boleh berbeda dari foto profil harian.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="yearbookQuote">Kutipan Yearbook</Label>
        <Textarea
          id="yearbookQuote"
          name="yearbookQuote"
          maxLength={280}
          rows={2}
          defaultValue={profile.yearbookQuote ?? ""}
          placeholder="Kutipan singkat untuk yearbook..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={3}
          defaultValue={profile.bio ?? ""}
          placeholder="Ceritakan sedikit tentang dirimu..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="citaCita">Cita-Cita</Label>
        <Input
          id="citaCita"
          name="citaCita"
          maxLength={150}
          defaultValue={profile.citaCita ?? ""}
          placeholder="Cita-citamu..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            name="instagram"
            maxLength={50}
            defaultValue={profile.socialLinks?.instagram ?? ""}
            placeholder="@namakamu"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tiktok">TikTok</Label>
          <Input
            id="tiktok"
            name="tiktok"
            maxLength={50}
            defaultValue={profile.socialLinks?.tiktok ?? ""}
            placeholder="@namakamu"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        Simpan Perubahan
      </Button>
    </form>
  );
}
