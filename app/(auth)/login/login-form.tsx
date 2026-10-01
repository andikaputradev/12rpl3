"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LoginState, loginAction } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Masuk ke Portal</CardTitle>
        <CardDescription>
          Akun disediakan oleh Wali Kelas / Pengurus. Registrasi tertutup.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
