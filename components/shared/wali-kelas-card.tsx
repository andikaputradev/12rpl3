import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/lib/db/schema";
import { cloudinaryOptimized, getInitials } from "@/lib/utils";

function toWhatsAppLink(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export function WaliKelasCard({ waliKelas }: { waliKelas: Profile }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <Avatar className="size-20">
          {waliKelas.avatarUrl ? (
            <AvatarImage
              src={cloudinaryOptimized(waliKelas.avatarUrl, "f_auto,q_auto,w_160,h_160,c_fill")}
              alt={waliKelas.fullName}
            />
          ) : null}
          <AvatarFallback className="text-lg">{getInitials(waliKelas.fullName)}</AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <Badge variant="outline">Wali Kelas</Badge>
          <p className="font-display text-lg font-medium">{waliKelas.fullName}</p>
        </div>

        {waliKelas.publicContact ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={toWhatsAppLink(waliKelas.publicContact)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
              Hubungi via WhatsApp
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
