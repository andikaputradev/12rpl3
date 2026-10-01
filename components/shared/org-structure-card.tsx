import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/db/schema";
import { cloudinaryOptimized, cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface OrgStructureCardProps {
  profile: Profile | null;
  fallbackLabel: string;
  tier: 1 | 2 | 3;
}

export function OrgStructureCard({ profile, fallbackLabel, tier }: OrgStructureCardProps) {
  const size = tier === 1 ? "size-20" : tier === 2 ? "size-16" : "size-14";

  if (!profile) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface/40 px-4 py-6 text-center",
        )}
      >
        <div className={cn(size, "flex items-center justify-center rounded-full bg-border/50")} />
        <p className="text-xs text-muted">Belum ditentukan</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          {fallbackLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-4 py-6 text-center transition-colors hover:border-accent/40">
      <Avatar className={size}>
        {profile.avatarUrl ? (
          <AvatarImage
            src={cloudinaryOptimized(profile.avatarUrl, "f_auto,q_auto,w_160,h_160,c_fill")}
            alt={profile.fullName}
          />
        ) : null}
        <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
      </Avatar>
      <p className={cn("font-medium", tier === 1 ? "text-base" : "text-sm")}>{profile.fullName}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
        {profile.jabatan ?? fallbackLabel}
      </p>
    </div>
  );
}
