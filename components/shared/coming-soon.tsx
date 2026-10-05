import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  title: string;
  description: string;
  phase: string;
  icon?: LucideIcon;
}

export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon = Construction,
}: ComingSoonProps) {
  return (
    <section className="container-portal flex min-h-[60vh] flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-surface">
        <Icon className="size-6 text-accent-text" aria-hidden="true" />
      </div>
      <Badge variant="outline">Segera Hadir - {phase}</Badge>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
      <p className="max-w-md text-sm text-muted sm:text-base">{description}</p>
    </section>
  );
}
