import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StudentListItem } from "@/lib/actions/direktori";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

export function StudentCard({ student }: { student: StudentListItem }) {
  const hasCustomAvatar = Boolean(student.avatarUrl) && !student.avatarUrl?.includes("pngtree");

  const content = (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-4 py-6 text-center transition-colors hover:border-accent/50">
      <Avatar className="size-16">
        {hasCustomAvatar && student.avatarUrl ? (
          <AvatarImage
            src={cloudinaryOptimized(student.avatarUrl, "f_auto,q_auto,w_128,h_128,c_fill")}
            alt={`Foto ${student.fullName}`}
          />
        ) : null}
        <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{student.fullName}</p>
        {student.absenNumber ? (
          <p className="font-mono text-xs text-muted">No. Absen {student.absenNumber}</p>
        ) : null}
      </div>
    </div>
  );

  if (!student.slug) return content;

  return (
    <Link href={`/direktori/${student.slug}`} className="cursor-pointer">
      {content}
    </Link>
  );
}
