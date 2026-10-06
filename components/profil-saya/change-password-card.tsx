"use client";

import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ChangePasswordState, changeMyPassword } from "@/lib/actions/auth-password";

const initialState: ChangePasswordState = {};

export function ChangePasswordCard() {
  const [state, formAction, isPending] = useActionState(changeMyPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = state.timestamp;
      toast.success("Kata sandi berhasil diperbarui!");
      formRef.current?.reset();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2 text-accent-text">
          <KeyRound className="size-5" />
          <CardTitle className="text-xl">Ganti Kata Sandi</CardTitle>
        </div>
        <CardDescription>
          Perbarui kata sandi akun Anda secara langsung. Tidak memerlukan konfirmasi email atau
          magic link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex max-w-md flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-new-password`}>Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id={`${formId}-new-password`}
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted">Minimal 8 karakter.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-confirm-password`}>Konfirmasi Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id={`${formId}-confirm-password`}
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                placeholder="Ulangi kata sandi baru"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  <span>Perbarui Kata Sandi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
