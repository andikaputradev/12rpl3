interface StatRatioBarProps {
  laki: number;
  perempuan: number;
}

export function StatRatioBar({ laki, perempuan }: StatRatioBarProps) {
  const total = laki + perempuan;
  const lakiPercent = total > 0 ? Math.round((laki / total) * 100) : 0;
  const perempuanPercent = 100 - lakiPercent;

  if (total === 0) {
    return <p className="text-sm text-muted">Data rasio belum tersedia.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-border">
        <div
          className="flex h-full items-center justify-center bg-accent"
          style={{ width: `${lakiPercent}%` }}
          role="img"
          aria-label={`Laki-laki ${lakiPercent} persen`}
        />
        <div
          className="flex h-full items-center justify-center bg-foreground/70"
          style={{ width: `${perempuanPercent}%` }}
          role="img"
          aria-label={`Perempuan ${perempuanPercent} persen`}
        />
      </div>
      <div className="flex justify-between font-mono text-xs uppercase tracking-[0.08em] text-muted">
        <span>Laki-laki {lakiPercent}%</span>
        <span>Perempuan {perempuanPercent}%</span>
      </div>
    </div>
  );
}
