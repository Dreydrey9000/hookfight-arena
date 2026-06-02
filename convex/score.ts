import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { runAI } from "./runAI";
import { scoringSchema, rewritesSchema } from "./aiSchemas";
import { PERSONAS, RUBRIC } from "./personas";
import { generateBracket, type Entrant } from "./bracket";

/**
 * scoreBattle — the AI heart of a battle, run as a scheduled action.
 *
 * 1. score every hook through all 4 personas (one runAI call),
 * 2. average to a per-hook score, compute the bracket in code, crown a winner,
 * 3. generate 3 rewrites of the winner (one runAI call),
 * 4. write it all back and flip the battle to "done".
 * Any failure flips the battle to "failed" — never a half-rendered result.
 */

const PERSONA_IDS = ["skimmer", "skeptic", "sharer", "buyer"] as const;
type PersonaId = (typeof PERSONA_IDS)[number];

export const scoreBattle = internalAction({
  args: { battleId: v.id("battles") },
  handler: async (ctx, { battleId }) => {
    const { battle, hooks } = await ctx.runQuery(
      internal.battles.getBattleData,
      { battleId },
    );

    const fail = () =>
      ctx.runMutation(internal.battles.finalize, {
        battleId,
        status: "failed" as const,
        rewrites: [],
      });

    if (!battle || hooks.length < 2) {
      await fail();
      return;
    }

    // Label hooks 1..n so the model echoes a stable id we can map back.
    const labelToId = new Map<string, Id<"hooks">>();
    const hookLines = hooks.map((h, i) => {
      const label = String(i + 1);
      labelToId.set(label, h._id);
      return `${label}. ${h.text}`;
    });

    const personaBlock = PERSONAS.map(
      (p) => `- ${p.id} (${p.name}): ${p.lens} Rewards ${p.rewards}; punishes ${p.punishes}.`,
    ).join("\n");

    try {
      // --- 1. persona scoring ---
      const scoring = await runAI({
        schema: scoringSchema,
        maxTokens: 2000,
        system: [
          "You are a ruthless but useful audience-simulation engine. Be accurate, not polite.",
          `Audience: ${battle.audience}. Platform: ${battle.platform}.`,
          "Score EACH hook through EACH of these 4 personas on a 0-100 scale,",
          `weighing: ${RUBRIC.join(", ")}.`,
          personaBlock,
          'Return JSON: { "results": [ { "hookId": "<the number label>", "persona": "skimmer|skeptic|sharer|buyer", "score": 0-100, "strongestReason": "...", "weakestReason": "..." } ] } with one entry per hook per persona.',
        ].join("\n"),
        user: `Hooks:\n${hookLines.join("\n")}`,
      });

      // Map labels back to real ids; drop anything we can't resolve.
      const votes = scoring.results
        .filter((r) => labelToId.has(r.hookId))
        .map((r) => ({
          hookId: labelToId.get(r.hookId)!,
          persona: r.persona as PersonaId,
          score: r.score,
          strongestReason: r.strongestReason,
          weakestReason: r.weakestReason,
        }));

      // Per-hook average across personas.
      const byHook = new Map<string, { sum: number; n: number }>();
      for (const vote of votes) {
        const k = vote.hookId as string;
        const cur = byHook.get(k) ?? { sum: 0, n: 0 };
        cur.sum += vote.score;
        cur.n += 1;
        byHook.set(k, cur);
      }

      const entrants: Entrant[] = hooks.map((h) => {
        const agg = byHook.get(h._id as string);
        return { hookId: h._id as string, score: agg ? agg.sum / agg.n : 0 };
      });

      const bracket = generateBracket(entrants);
      const winnerId = bracket.winnerHookId as Id<"hooks">;

      // Ranks: highest average = rank 1.
      const ranked = [...entrants].sort((a, b) => b.score - a.score);
      const hookScores = ranked.map((e, i) => ({
        hookId: e.hookId as Id<"hooks">,
        score: Math.round(e.score),
        rank: i + 1,
      }));

      // --- 2. rewrites of the winner ---
      const winnerHook = hooks.find((h) => h._id === winnerId);
      const rewriteOut = await runAI({
        schema: rewritesSchema,
        maxTokens: 600,
        system: [
          `Audience: ${battle.audience}. Platform: ${battle.platform}.`,
          "Rewrite the winning hook 3 ways, each sharper and distinct. Be accurate, not polite.",
          'Return JSON: { "rewrites": [ { "style": "<short label>", "text": "<rewrite>" } ] } with exactly 3.',
        ].join("\n"),
        user: `Winning hook: ${winnerHook?.text ?? ""}`,
      });

      const rewrites = rewriteOut.rewrites.map((rw) => ({
        sourceHookId: winnerId,
        style: rw.style,
        text: rw.text,
      }));

      await ctx.runMutation(internal.battles.saveScoring, {
        battleId,
        hookScores,
        votes,
      });
      await ctx.runMutation(internal.battles.finalize, {
        battleId,
        winnerHookId: winnerId,
        status: "done",
        rewrites,
      });
    } catch (err) {
      console.error("scoreBattle failed", err);
      await fail();
    }
  },
});
