import Link from "next/link";

/**
 * Landing page. Goal: a visitor understands the product in ~12 seconds and
 * clicks "Run my hooks." The static demo bracket below is the proof-it-works
 * artifact (a live animated one lands later).
 */

const DEMO = [
  { round: "Semifinal", a: "Most personal brands are resumes with fonts", b: "Post consistently, they said", winner: "a" },
  { round: "Semifinal", a: "I grew a newsletter to 10k with zero ads", b: "Nobody tells you what to post", winner: "a" },
  { round: "Final", a: "Most personal brands are resumes with fonts", b: "I grew a newsletter to 10k with zero ads", winner: "b" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-neutral-950 px-5 text-neutral-100">
      <section className="w-full max-w-2xl pt-20 pb-12 text-center">
        <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          AI hook-testing arena
        </span>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Your hooks fight.
          <br />
          The best one wins.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">
          Paste 5–10 hooks. Four AI audience personas — a Skimmer, a Skeptic, a
          Sharer, and a Buyer — score and roast each one, fight them down to a
          champion, and hand you 3 sharper rewrites you can post today.
        </p>
        <Link
          href="/new"
          className="mt-8 inline-block rounded-lg bg-amber-500 px-6 py-3.5 font-bold text-neutral-950 transition hover:bg-amber-400"
        >
          Run my hooks →
        </Link>
        <p className="mt-3 text-xs text-neutral-500">
          Free: 3 battles a day. No card to start.
        </p>
      </section>

      {/* Static demo bracket */}
      <section className="w-full max-w-2xl pb-24">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-neutral-500">
          A battle, resolved
        </p>
        <div className="space-y-3">
          {DEMO.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-400/80">
                {m.round}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span
                  className={`rounded-lg px-3 py-2 ${
                    m.winner === "a"
                      ? "bg-amber-500/15 font-medium text-amber-200 ring-1 ring-amber-500/30"
                      : "bg-neutral-800/60 text-neutral-500 line-through"
                  }`}
                >
                  {m.a}
                </span>
                <span
                  className={`rounded-lg px-3 py-2 ${
                    m.winner === "b"
                      ? "bg-amber-500/15 font-medium text-amber-200 ring-1 ring-amber-500/30"
                      : "bg-neutral-800/60 text-neutral-500 line-through"
                  }`}
                >
                  {m.b}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
