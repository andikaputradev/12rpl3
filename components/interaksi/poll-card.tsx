"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PollResultsBar } from "@/components/interaksi/poll-results-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PollResultRow, PollWithOptions } from "@/lib/actions/interaksi";
import { submitVote } from "@/lib/actions/interaksi-mutations";

interface PollCardProps {
  poll: PollWithOptions;
  myVote: string[];
  results: PollResultRow[] | null;
  isAuthenticated: boolean;
}

export function PollCard({ poll, myVote, results, isAuthenticated }: PollCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);

  const hasVoted = myVote.length > 0;
  const showResults = hasVoted || poll.isClosed || poll.showResultsBeforeClose;

  function toggleOption(optionId: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, optionId] : current.filter((id) => id !== optionId),
    );
  }

  function handleSubmit() {
    if (selected.length === 0) {
      toast.error("Pilih minimal satu opsi.");
      return;
    }
    startTransition(async () => {
      const result = await submitVote(poll.id, selected);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Suara tersimpan. Terima kasih sudah memilih.");
      router.refresh();
    });
  }

  const totalVotes = results?.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{poll.question}</p>
          {poll.description ? <p className="mt-1 text-muted text-sm">{poll.description}</p> : null}
        </div>
        {poll.isClosed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted/20 px-2.5 py-1 font-medium text-[11px] text-muted">
            <Lock className="size-3" aria-hidden="true" />
            Ditutup
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {showResults ? (
          <div className="space-y-3">
            {poll.options.map((option) => {
              const count = results?.find((row) => row.optionId === option.id)?.count ?? 0;
              return (
                <PollResultsBar
                  key={option.id}
                  label={option.label}
                  count={count}
                  total={totalVotes}
                  isMyChoice={myVote.includes(option.id)}
                />
              );
            })}
            <p className="text-muted text-xs">{totalVotes} suara masuk.</p>
          </div>
        ) : !isAuthenticated ? (
          <p className="text-muted text-sm">Masuk untuk ikut memilih pada polling ini.</p>
        ) : poll.allowMultipleChoice ? (
          <div className="space-y-2.5">
            {poll.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2.5">
                <Checkbox
                  id={`poll-${poll.id}-${option.id}`}
                  checked={selected.includes(option.id)}
                  onCheckedChange={(checked) => toggleOption(option.id, checked === true)}
                />
                <Label htmlFor={`poll-${poll.id}-${option.id}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={selected[0] ?? ""} onValueChange={(value) => setSelected([value])}>
            {poll.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2.5">
                <RadioGroupItem id={`poll-${poll.id}-${option.id}`} value={option.id} />
                <Label htmlFor={`poll-${poll.id}-${option.id}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>

      {!showResults && isAuthenticated ? (
        <Button onClick={handleSubmit} disabled={isPending} className="mt-4">
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Kirim Suara
        </Button>
      ) : null}
    </div>
  );
}
