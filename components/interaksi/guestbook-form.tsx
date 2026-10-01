"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TurnstileWidget } from "@/components/shared/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitGuestbookEntry } from "@/lib/actions/interaksi-mutations";
import type { GuestbookContext } from "@/lib/db/schema";

interface GuestbookFormProps {
  context: GuestbookContext;
  nonce: string;
}

const initialState = { error: undefined, success: undefined, timestamp: undefined };

export function GuestbookForm({ context, nonce }: GuestbookFormProps) {
  const submitWithContext = submitGuestbookEntry.bind(null, context);
  const [state, formAction, isPending] = useActionState(submitWithContext, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("Pesanmu terkirim. Akan tampil setelah ditinjau.");
      formRef.current?.reset();
      setTurnstileToken("");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`guestbook-name-${context}`}>Nama</Label>
        <Input
          id={`guestbook-name-${context}`}
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="Nama kamu"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`guestbook-message-${context}`}>Pesan</Label>
        <Textarea
          id={`guestbook-message-${context}`}
          name="message"
          required
          minLength={5}
          maxLength={500}
          rows={4}
          placeholder="Tinggalkan pesan atau kesan untuk kelas XII RPL 3..."
        />
      </div>

      {/* Honeypot: posisi di luar layar (BUKAN display:none) agar skrip
          generik yang hanya memeriksa visibility/display tetap mengisinya,
          sementara pengguna manusia dan pembaca layar tidak pernah
          melihat/mendengarnya (Bagian 9 prompt). */}
      <div
        className="absolute top-auto left-[-9999px] h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor={`guestbook-website-${context}`}>Website</label>
        <input
          id={`guestbook-website-${context}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <input type="hidden" name="turnstileToken" value={turnstileToken} />
      <TurnstileWidget
        nonce={nonce}
        onToken={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
      />

      <Button type="submit" disabled={isPending || !turnstileToken} className="w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        Kirim Pesan
      </Button>
    </form>
  );
}
