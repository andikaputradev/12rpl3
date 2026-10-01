import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PollResultsBarProps {
  label: string;
  count: number;
  total: number;
  isMyChoice: boolean;
}

export function PollResultsBar({ label, count, total, isMyChoice }: PollResultsBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className={cn("flex items-center gap-1.5", isMyChoice && "font-medium")}>
          {isMyChoice ? <Check className="size-3.5 text-accent" aria-hidden="true" /> : null}
          {label}
        </span>
        <span className="shrink-0 font-mono text-muted text-xs">
          {percentage}% · {count} suara
        </span>
      </div>
      <Progress
        value={percentage}
        aria-label={`${label}: ${percentage} persen`}
        className={cn(isMyChoice && "[&_[data-slot=progress-indicator]]:bg-accent")}
      />
    </div>
  );
}
