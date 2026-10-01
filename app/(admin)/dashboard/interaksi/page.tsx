import type { Metadata } from "next";
import { AspirationModerationList } from "@/components/admin/aspiration-moderation-list";
import { GuestbookModerationList } from "@/components/admin/guestbook-moderation-list";
import { PollManager } from "@/components/admin/poll-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPendingAspirations, getPendingGuestbook } from "@/lib/actions/admin-interaksi";
import { getPolls } from "@/lib/actions/interaksi";

export const metadata: Metadata = {
  title: "Kelola Interaksi",
};

export default async function AdminInteraksiPage() {
  const [pendingGuestbook, pendingAspirations, polls] = await Promise.all([
    getPendingGuestbook(),
    getPendingAspirations(),
    getPolls(),
  ]);

  return (
    <div className="container-portal py-8">
      <h1 className="font-display text-2xl">Kelola Interaksi</h1>
      <p className="mt-1 text-muted text-sm">
        Moderasi buku tamu dan aspirasi, serta kelola polling kelas.
      </p>

      <Tabs defaultValue="buku-tamu" className="mt-6">
        <TabsList>
          <TabsTrigger value="buku-tamu">
            Buku Tamu {pendingGuestbook.length > 0 ? `(${pendingGuestbook.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="aspirasi">
            Aspirasi {pendingAspirations.length > 0 ? `(${pendingAspirations.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="polling">Polling</TabsTrigger>
        </TabsList>

        <TabsContent value="buku-tamu" className="mt-4">
          <GuestbookModerationList initialEntries={pendingGuestbook} />
        </TabsContent>
        <TabsContent value="aspirasi" className="mt-4">
          <AspirationModerationList initialAspirations={pendingAspirations} />
        </TabsContent>
        <TabsContent value="polling" className="mt-4">
          <PollManager polls={polls} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
