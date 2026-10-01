"use client";

import { Check, ChevronsUpDown, Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { StudentListItem } from "@/lib/actions/direktori";
import { submitPesanKesan } from "@/lib/actions/kelulusan-mutations";
import { cn } from "@/lib/utils";

interface PesanKesanFormProps {
  students: StudentListItem[];
  currentStudentId: string;
}

const initialState = { error: undefined, success: undefined, timestamp: undefined };

export function PesanKesanForm({ students, currentStudentId }: PesanKesanFormProps) {
  const [state, formAction, isPending] = useActionState(submitPesanKesan, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const recipients = students.filter((student) => student.id !== currentStudentId);
  const selectedStudent = recipients.find((student) => student.id === selectedId) ?? null;

  useEffect(() => {
    if (state.success) {
      toast.success("Pesan-kesan terkirim.");
      formRef.current?.reset();
      setSelectedId(null);
      setIsAnonymous(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pesan-kesan-recipient">Kirim untuk</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              id="pesan-kesan-recipient"
              className="w-full justify-between font-normal"
            >
              {selectedStudent ? selectedStudent.fullName : "Cari nama teman sekelas..."}
              <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[var(--radix-popper-anchor-width)] p-0">
            <Command>
              <CommandInput placeholder="Ketik nama..." />
              <CommandList>
                <CommandEmpty>Tidak ada nama yang cocok.</CommandEmpty>
                <CommandGroup>
                  {recipients.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={student.fullName}
                      onSelect={() => {
                        setSelectedId(student.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          selectedId === student.id ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden="true"
                      />
                      {student.fullName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <input type="hidden" name="toStudentId" value={selectedId ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pesan-kesan-message">Pesan</Label>
        <Textarea
          id="pesan-kesan-message"
          name="message"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          placeholder="Tulis kesan dan pesanmu..."
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-3.5 py-3">
        <div>
          <Label htmlFor="pesan-kesan-anonymous">Kirim sebagai anonim</Label>
          <p className="text-muted text-xs">
            Nama kamu disembunyikan dari penerima, staf tetap dapat melihatnya.
          </p>
        </div>
        <Switch id="pesan-kesan-anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
      </div>
      {isAnonymous ? <input type="hidden" name="isAnonymous" value="on" /> : null}

      <Button type="submit" disabled={isPending || !selectedId} className="w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        Kirim Pesan-Kesan
      </Button>
    </form>
  );
}
