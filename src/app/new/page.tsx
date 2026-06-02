"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  PLATFORMS,
  AUDIENCE_PRESETS,
  STARTER_HOOKS,
  HOOKS_MAX,
  type PlatformId,
} from "@/lib/constants";
import { parseHooks } from "@/lib/parseHooks";

export default function NewBattlePage() {
  const router = useRouter();
  const createBattle = useMutation(api.battles.createBattle);
  const [platform, setPlatform] = useState<PlatformId>("linkedin");
  const [audience, setAudience] = useState<string>(AUDIENCE_PRESETS[0]);
  const [raw, setRaw] = useState<string>(STARTER_HOOKS.linkedin);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsed = parseHooks(raw);
  const count = parsed.hooks.length;

  function pickPlatform(id: PlatformId) {
    setPlatform(id);
    // Swap the starter hooks only if the user hasn't typed their own yet.
    const isStarter = Object.values(STARTER_HOOKS).includes(raw.trim());
    if (isStarter || raw.trim() === "") setRaw(STARTER_HOOKS[id]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseHooks(raw);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { battleId } = await createBattle({
        audience,
        platform,
        hooks: result.hooks,
      });
      router.push(`/b/${battleId}`);
    } catch {
      setError("Couldn't start the battle. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-neutral-300"
      >
        ← HookFight Arena
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-50">
        Run a battle
      </h1>
      <p className="mt-2 text-neutral-400">
        Paste your hooks, pick who's judging, and watch four AI personas fight
        them down to a winner.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-7">
        {/* Platform */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-neutral-300">
            Platform
          </legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPlatform(p.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  platform === p.id
                    ? "bg-amber-500 text-neutral-950"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Audience */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-neutral-300">
            Audience
          </legend>
          <input
            list="audience-presets"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Who is judging these hooks?"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
          <datalist id="audience-presets">
            {AUDIENCE_PRESETS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </fieldset>

        {/* Hooks */}
        <fieldset>
          <div className="mb-2 flex items-baseline justify-between">
            <legend className="text-sm font-semibold text-neutral-300">
              Your hooks
            </legend>
            <span
              className={`text-xs ${
                count > HOOKS_MAX ? "text-red-400" : "text-neutral-500"
              }`}
            >
              {count}/{HOOKS_MAX} · one per line
            </span>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-3 font-mono text-sm leading-relaxed text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </fieldset>

        {error && (
          <p className="rounded-lg bg-red-950/60 px-3.5 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!!parsed.error || submitting}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 font-bold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Starting the fight…" : "Start the fight →"}
        </button>
      </form>
    </main>
  );
}
