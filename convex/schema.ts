import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * HookFight Arena data model.
 *
 * One battle = one paste of hooks, scored by 4 personas, resolved into a
 * single-elimination bracket, ending on a winner + rewrites + a share card.
 *
 * Everything is typed with v.* (never v.any()) so the client can't send junk
 * and the server can't leak shapes it didn't mean to.
 */

// The 4 fixed audience personas. Kept as a reusable validator so every table
// and function speaks the same vocabulary (Pocock's "ubiquitous language").
export const personaValidator = v.union(
  v.literal("skimmer"), // scrolls fast — rewards clarity
  v.literal("skeptic"), // distrusts hype — rewards credibility
  v.literal("sharer"), // shares for status — rewards shareability
  v.literal("buyer"), // ready to spend — rewards commercial intent
);

export const planValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("agency"),
);

export const battleStatusValidator = v.union(
  v.literal("running"),
  v.literal("done"),
  v.literal("failed"),
);

export default defineSchema({
  // One row per signed-in person. Credits are the cost ceiling (free = 3/day).
  // authUserId is the Convex Auth subject (set when we wire @convex-dev/auth).
  // When auth is wired, these app fields may fold into the authTables users row.
  users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    plan: planValidator,
    creditsToday: v.number(),
    creditsResetAt: v.number(), // ms epoch when the daily count resets
  }).index("by_auth_user", ["authUserId"]),

  // One row per battle the user runs.
  battles: defineTable({
    userId: v.id("users"),
    title: v.string(),
    audience: v.string(), // e.g. "B2B founders on LinkedIn"
    platform: v.string(), // e.g. "linkedin" | "x" | "instagram"
    status: battleStatusValidator,
    winnerHookId: v.optional(v.id("hooks")),
    publicSlug: v.string(), // unguessable slug for the share page
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public_slug", ["publicSlug"]),

  // The hooks being fought. score/rank fill in after scoring.
  hooks: defineTable({
    battleId: v.id("battles"),
    text: v.string(),
    seed: v.number(), // original paste order
    score: v.optional(v.number()), // overall, averaged across personas
    rank: v.optional(v.number()), // 1 = winner
  }).index("by_battle", ["battleId"]),

  // One row per (hook x persona). The bracket is computed from these in code.
  personaVotes: defineTable({
    battleId: v.id("battles"),
    hookId: v.id("hooks"),
    persona: personaValidator,
    score: v.number(), // 0-100 on the rubric
    strongestReason: v.string(),
    weakestReason: v.string(),
  })
    .index("by_battle", ["battleId"])
    .index("by_hook", ["hookId"]),

  // 3 AI rewrites of the winning hook.
  rewrites: defineTable({
    battleId: v.id("battles"),
    sourceHookId: v.id("hooks"),
    style: v.string(), // e.g. "punchier", "contrarian", "specific"
    text: v.string(),
  }).index("by_battle", ["battleId"]),

  // The screenshot-worthy artifact + its public slug.
  shareCards: defineTable({
    battleId: v.id("battles"),
    imageUrl: v.string(),
    publicSlug: v.string(),
  })
    .index("by_battle", ["battleId"])
    .index("by_public_slug", ["publicSlug"]),
});
