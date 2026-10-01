"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, updateKasSettings } from "@/lib/actions/admin-kas";
import type { KasSettings } from "@/lib/db/schema";

const initialState: ActionState = {};

export function KasSettingsForm({ settings }: { settings: KasSettings | null }) {
  const [state, formAction, isPending] = useActionState(updateKasSettings, initialState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Pengaturan kas digital tersimpan.");
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Kas Digital</CardTitle>
        <CardDescription>
          Murni tampilan QRIS dan nomor DANA agar siswa scan/transfer manual — tidak ada payment
          gateway maupun pencatatan transaksi otomatis di sistem ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-qris`}>Gambar QRIS (JPEG/PNG/WebP)</Label>
            <Input
              id={`${formId}-qris`}
              name="qrisImage"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
            {settings?.qrisImageUrl ? (
              <p className="text-muted text-xs">
                QRIS saat ini sudah terpasang. Unggah berkas baru untuk menggantinya, atau biarkan
                kosong untuk mempertahankan yang lama.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-dana-number`}>Nomor DANA</Label>
            <Input
              id={`${formId}-dana-number`}
              name="danaNumber"
              defaultValue={settings?.danaNumber ?? ""}
              placeholder="081234567890"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-dana-name`}>Nama Akun DANA</Label>
            <Input
              id={`${formId}-dana-name`}
              name="danaAccountName"
              defaultValue={settings?.danaAccountName ?? ""}
              maxLength={100}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-nominal`}>Info Nominal (opsional)</Label>
            <Input
              id={`${formId}-nominal`}
              name="nominalInfo"
              defaultValue={settings?.nominalInfo ?? ""}
              maxLength={100}
              placeholder="Rp10.000 / minggu"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${formId}-instructions`}>Instruksi Tambahan (opsional)</Label>
            <Textarea
              id={`${formId}-instructions`}
              name="instructions"
              defaultValue={settings?.instructions ?? ""}
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
