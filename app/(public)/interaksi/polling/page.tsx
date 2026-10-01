import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { PollCard } from "@/components/interaksi/poll-card";
import { getOptionalUser } from "@/lib/actions/guard";
import { getMyVote, getPollResults, getPolls } from "@/lib/actions/interaksi";

export const metadata: Metadata = {
  title: "Polling",
  description: "Jajak pendapat seputar kegiatan kelas XII RPL 3 SMKN 1 Sukoharjo.",
};

export default async function PollingPage() {
  const [polls, auth] = await Promise.all([getPolls(), getOptionalUser()]);

  const pollCards = await Promise.all(
    polls.map(async (poll) => {
      const myVote = await getMyVote(poll.id);
      const shouldShowResults = myVote.length > 0 || poll.isClosed || poll.showResultsBeforeClose;
      const results = shouldShowResults ? await getPollResults(poll.id) : null;
      return { poll, myVote, results };
    }),
  );

  return (
    <div className="container-portal py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 text-accent-text">
          <BarChart3 className="size-5" aria-hidden="true" />
          <p className="font-medium text-sm uppercase tracking-wide">Interaksi</p>
        </div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Polling</h1>
        <p className="mt-2 text-muted">Jajak pendapat aktif dan yang sudah ditutup.</p>

        <div className="mt-8 space-y-5">
          {pollCards.length === 0 ? (
            <p className="rounded-lg border border-border border-dashed bg-surface/50 px-4 py-10 text-center text-muted text-sm">
              Belum ada polling.
            </p>
          ) : (
            pollCards.map(({ poll, myVote, results }) => (
              <PollCard
                key={poll.id}
                poll={poll}
                myVote={myVote}
                results={results}
                isAuthenticated={Boolean(auth)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
