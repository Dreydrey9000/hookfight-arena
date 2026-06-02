import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Battle lifecycle. createBattle inserts the battle + hooks (status "running")
 * and schedules the scoring action; getBattle is the reactive read the results
 * screen subscribes to. Anonymous-first v1 — no userId required.
 */

const MAX_HOOKS = 10;
const MAX_HOOK_LEN = 280;

export const createBattle = mutation({
  args: {
    audience: v.string(),
    platform: v.string(),
    hooks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const clean = args.hooks
      .map((h) => h.trim().slice(0, MAX_HOOK_LEN))
      .filter(Boolean)
      .slice(0, MAX_HOOKS);
    if (clean.length < 2) throw new Error("Need at least 2 hooks");

    const publicSlug = crypto.randomUUID().slice(0, 8);
    const battleId = await ctx.db.insert("battles", {
      audience: args.audience,
      platform: args.platform,
      status: "running",
      publicSlug,
      title: `${args.platform} battle`,
      createdAt: Date.now(),
    });

    for (let i = 0; i < clean.length; i++) {
      await ctx.db.insert("hooks", { battleId, text: clean[i], seed: i });
    }

    await ctx.scheduler.runAfter(0, internal.score.scoreBattle, { battleId });
    return { battleId, publicSlug };
  },
});

export const getBattle = query({
  args: { battleId: v.id("battles") },
  handler: async (ctx, { battleId }) => {
    const battle = await ctx.db.get(battleId);
    if (!battle) return null;
    const hooks = await ctx.db
      .query("hooks")
      .withIndex("by_battle", (q) => q.eq("battleId", battleId))
      .collect();
    const votes = await ctx.db
      .query("personaVotes")
      .withIndex("by_battle", (q) => q.eq("battleId", battleId))
      .collect();
    const rewrites = await ctx.db
      .query("rewrites")
      .withIndex("by_battle", (q) => q.eq("battleId", battleId))
      .collect();
    hooks.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    return { battle, hooks, votes, rewrites };
  },
});

// ---- internal (used by the scoring action) ----

export const getBattleData = internalQuery({
  args: { battleId: v.id("battles") },
  handler: async (ctx, { battleId }) => {
    const battle = await ctx.db.get(battleId);
    const hooks = await ctx.db
      .query("hooks")
      .withIndex("by_battle", (q) => q.eq("battleId", battleId))
      .collect();
    return { battle, hooks };
  },
});

export const saveScoring = internalMutation({
  args: {
    battleId: v.id("battles"),
    hookScores: v.array(
      v.object({ hookId: v.id("hooks"), score: v.number(), rank: v.number() }),
    ),
    votes: v.array(
      v.object({
        hookId: v.id("hooks"),
        persona: v.union(
          v.literal("skimmer"),
          v.literal("skeptic"),
          v.literal("sharer"),
          v.literal("buyer"),
        ),
        score: v.number(),
        strongestReason: v.string(),
        weakestReason: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const s of args.hookScores) {
      await ctx.db.patch(s.hookId, { score: s.score, rank: s.rank });
    }
    for (const vote of args.votes) {
      await ctx.db.insert("personaVotes", { battleId: args.battleId, ...vote });
    }
  },
});

export const finalize = internalMutation({
  args: {
    battleId: v.id("battles"),
    winnerHookId: v.optional(v.id("hooks")),
    status: v.union(v.literal("done"), v.literal("failed")),
    rewrites: v.array(
      v.object({ sourceHookId: v.id("hooks"), style: v.string(), text: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.battleId, {
      status: args.status,
      winnerHookId: args.winnerHookId,
    });
    for (const r of args.rewrites) {
      await ctx.db.insert("rewrites", { battleId: args.battleId, ...r });
    }
  },
});
