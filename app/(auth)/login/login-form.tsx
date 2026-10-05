"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LoginState, loginAction } from "./actions";

const initialState: LoginState = {};

const DEMO_ACCOUNTS = [
  { role: "Super Admin", name: "Wahyu", email: "admin@12rpl.com" },
  { role: "Wali Kelas", name: "Mintati S., Pd", email: "walikelas@12rpl.com" },
  { role: "Ketua Kelas", name: "Wahyu Andika", email: "wahyu.andika.putra@12rpl.com" },
  { role: "Bendahara", name: "Sifa Auliya", email: "sifa.auliya@12rpl.com" },
  { role: "Sekretaris", name: "Samrotul", email: "samrotul.khasanah@12rpl.com" },
  { role: "Siswa", name: "Pratama Aditya", email: "pratama.aditya@12rpl.com" },
] as const;

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123#");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Masuk ke Portal</CardTitle>
        <CardDescription>
          Akun disediakan oleh Wali Kelas atau Pengurus. Registrasi tertutup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick Demo Role Picker */}
        <div className="mb-5 rounded-lg border border-border/80 bg-surface/40 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Uji Coba Cepat (Pilih Peran Akun)
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectDemo(acc.email)}
                className={`rounded-md border p-1.5 text-left text-xs transition-colors cursor-pointer ${
                  email === acc.email
                    ? "border-accent bg-accent/10 font-medium text-accent-text"
                    : "border-border/80 bg-surface hover:border-accent/40 text-foreground"
                }`}
              >
                <div className="truncate font-medium">{acc.role}</div>
                <div className="truncate text-[10px] text-muted">{acc.name}</div>
              </button>
            ))}
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4" noValidate>
          {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            />
            {state.fieldErrors?.email ? (
              <p id="email-error" className="text-xs text-destructive-text">
                {state.fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            />
            {state.fieldErrors?.password ? (
              <p id="password-error" className="text-xs text-destructive-text">
                {state.fieldErrors.password}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-text"
            >
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending} className="mt-1">
            {isPending ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
