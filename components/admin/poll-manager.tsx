"use client";

import { Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closePoll, createPoll } from "@/lib/actions/admin-interaksi-mutations";
import type { PollWithOptions } from "@/lib/actions/interaksi";

const initialState = { error: undefined, success: undefined, timestamp: undefined };

function createOptionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `option-${Math.random().toString(36).slice(2)}`;
}

function CreatePollForm() {
  const [state, formAction, isPending] = useActionState(createPoll, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [options, setOptions] = useState([
    { id: createOptionId(), value: "" },
    { id: createOptionId(), value: "" },
  ]);

  useEffect(() => {
    if (state.success) {
      toast.success("Polling dibuat.");
      formRef.current?.reset();
      setOptions([
        { id: createOptionId(), value: "" },
        { id: createOptionId(), value: "" },
      ]);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="poll-question">Pertanyaan</Label>
        <Input id="poll-question" name="question" required minLength={5} maxLength={300} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="poll-description">Deskripsi (opsional)</Label>
        <Textarea id="poll-description" name="description" maxLength={500} rows={2} />
      </div>

      <div className="space-y-1.5">
        <Label>Opsi Jawaban</Label>
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              name="options"
              required
              maxLength={120}
              value={option.value}
              onChange={(event) => {
                const nextValue = event.target.value;
                setOptions((current) =>
                  current.map((item) =>
                    item.id === option.id ? { ...item, value: nextValue } : item,
                  ),
                );
              }}
              placeholder={`Opsi ${index + 1}`}
            />
            {options.length > 2 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setOptions((current) => current.filter((item) => item.id !== option.id))
                }
                aria-label={`Hapus opsi ${index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ))}
        {options.length < 10 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setOptions((current) => [...current, { id: createOptionId(), value: "" }])
            }
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Tambah Opsi
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="poll-allow-multiple" name="allowMultipleChoice" />
        <Label htmlFor="poll-allow-multiple" className="font-normal">
          Izinkan lebih dari satu pilihan
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="poll-show-results" name="showResultsBeforeClose" />
        <Label htmlFor="poll-show-results" className="font-normal">
          Tampilkan hasil sebelum ditutup / sebelum memilih
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="poll-closes-at">Tanggal Penutupan (opsional)</Label>
        <Input id="poll-closes-at" name="closesAt" type="datetime-local" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Buat Polling
      </Button>
    </form>
  );
}

function PollRow({ poll }: { poll: PollWithOptions }) {
  const [isPending, startTransition] = useTransition();
  const [isClosed, setIsClosed] = useState(poll.isClosed);

  function handleClose() {
    startTransition(async () => {
      const result = await closePoll(poll.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Polling ditutup.");
      setIsClosed(true);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">{poll.question}</p>
        <p className="text-muted text-xs">{poll.options.length} opsi</p>
      </div>
      {isClosed ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted/20 px-2.5 py-1 font-medium text-[11px] text-muted">
          <Lock className="size-3" aria-hidden="true" />
          Ditutup
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleClose}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          Tutup Polling
        </Button>
      )}
    </div>
  );
}

export function PollManager({ polls }: { polls: PollWithOptions[] }) {
  return (
    <div className="space-y-6">
      <CreatePollForm />
      <div className="space-y-2">
        {polls.length === 0 ? (
          <p className="text-muted text-sm">Belum ada polling.</p>
        ) : (
          polls.map((poll) => <PollRow key={poll.id} poll={poll} />)
        )}
      </div>
    </div>
  );
}
