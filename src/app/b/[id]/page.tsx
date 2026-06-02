"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const PERSONA_LABELS: Record<string, string> = {
  skimmer: "Skimmer",
  skeptic: "Skeptic",
  sharer: "Sharer",
  buyer: "Buyer",
};

export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const battleId = params.id as Id<"battles">;
  const data = useQuery(api.battles.getBattle, { battleId });

  if (data === undefined) {
    return <Centered>Loading…</Centered>;
  }
  if (data === null || !data.battle) {
    return <Centered>Battle not found.</Centered>;
  }

  const { battle, hooks, votes, rewrites } = data;

  if (battle.status === "running") {
    return (
      <Centered>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-500" />
          <p className="font-semibold text-neutral-100">The hooks are fighting…</p>
          <p className="mt-1 text-sm text-neutral-500">
            4 personas scoring {hooks.length} hooks. This takes a few seconds.
          </p>
        </div>
      </Centered>
    );
  }

  if (battle.status === "failed") {
    return (
      <Centered>
        <div className="text-center">
          <p className="font-semibold text-red-300">The battle failed to score.</p>
          <Link href="/new" className="mt-2 inline-block text-sm text-amber-400 underline">
            Try again →
          </Link>
        </div>
      </Centered>
    );
  }

  const winner = hooks.find((h) => h._id === battle.winnerHookId) ?? hooks[0];
  const winnerVotes = votes.filter((v) => v.hookId === winner?._id);

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-neutral-100">
      <Link href="/new" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Run another battle
      </Link>

      {/* Winner */}
      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Winner
        </p>
        <p className="mt-1 text-xl font-bold text-neutral-50">{winner?.text}</p>
        <p className="mt-1 text-sm text-neutral-400">
          Score {winner?.score ?? 0}/100 · vs {battle.audience} on {battle.platform}
        </p>
      </div>

      {/* Why it won */}
      {winnerVotes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-400">
            Why it won
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {winnerVotes.map((v, i) => (
              <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <p className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">
                    {PERSONA_LABELS[v.persona] ?? v.persona}
                  </span>
                  <span className="font-mono text-amber-300">{v.score}</span>
                </p>
                <p className="mt-1 text-xs text-neutral-400">{v.strongestReason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All hooks ranked */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-400">
          The bracket
        </h2>
        <div className="space-y-1.5">
          {hooks.map((h) => (
            <div
              key={h._id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                h._id === winner?._id
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-neutral-800 bg-neutral-900/60"
              }`}
            >
              <span className="text-neutral-500">{h.rank ?? "–"}</span>
              <span className="flex-1 text-neutral-100">{h.text}</span>
              <span className="font-mono text-neutral-400">{h.score ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rewrites */}
      {rewrites.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-400">
            3 sharper rewrites
          </h2>
          <div className="space-y-2">
            {rewrites.map((r) => (
              <div key={r._id} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <p className="text-xs font-semibold text-amber-300/80">{r.style}</p>
                <p className="mt-1 text-sm text-neutral-100">{r.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-20 text-neutral-300">
      {children}
    </main>
  );
}
