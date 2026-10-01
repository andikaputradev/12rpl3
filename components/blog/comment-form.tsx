"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, addComment } from "@/lib/actions/blog-mutations";

const initialState: ActionState = {};

export function CommentForm({ postId }: { postId: string }) {
  const boundAction = addComment.bind(null, postId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success("Komentar ditambahkan.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <label htmlFor={`${formId}-content`} className="sr-only">
        Tulis komentar
      </label>
      <Textarea
        id={`${formId}-content`}
        name="content"
        required
        minLength={2}
        maxLength={1000}
        rows={3}
        placeholder="Tulis komentar..."
      />
      <Button type="submit" disabled={isPending} size="sm" className="self-end">
        {isPending ? "Mengirim..." : "Kirim Komentar"}
      </Button>
    </form>
  );
}
