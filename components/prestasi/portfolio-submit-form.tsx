"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, submitPortfolioProject } from "@/lib/actions/portofolio-mutations";

const initialState: ActionState = {};

export function PortfolioSubmitForm({
  classmates,
}: {
  classmates: { id: string; fullName: string }[];
}) {
  const [state, formAction, isPending] = useActionState(submitPortfolioProject, initialState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success("Proyek terkirim untuk ditinjau staf.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Proyek Kamu</CardTitle>
        <CardDescription>Proyek tampil publik di /prestasi setelah disetujui staf.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-title`}>Judul Proyek</Label>
            <Input id={`${formId}-title`} name="title" required maxLength={150} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-description`}>Deskripsi</Label>
            <Textarea
              id={`${formId}-description`}
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-tech`}>Tech Stack (pisahkan dengan koma)</Label>
            <Input
              id={`${formId}-tech`}
              name="techStack"
              placeholder="Next.js, TypeScript, Tailwind CSS"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-demo`}>Tautan Demo (opsional)</Label>
              <Input id={`${formId}-demo`} name="projectUrl" type="url" placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-repo`}>Tautan Repo (opsional)</Label>
              <Input
                id={`${formId}-repo`}
                name="repoUrl"
                type="url"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-thumbnail`}>Thumbnail (opsional)</Label>
            <Input
              id={`${formId}-thumbnail`}
              name="thumbnail"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          {classmates.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>Kontributor Lain (opsional)</Label>
              <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3">
                {classmates.map((classmate) => {
                  const checkboxId = `${formId}-contributor-${classmate.id}`;
                  return (
                    <div key={classmate.id} className="flex items-center gap-2">
                      <Checkbox id={checkboxId} name="contributorIds" value={classmate.id} />
                      <Label htmlFor={checkboxId} className="cursor-pointer font-normal text-sm">
                        {classmate.fullName}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? "Mengirim..." : "Kirim untuk Ditinjau"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
