import { z } from "zod";

/**
 * Zod schemas for every AI response. The model returns text; we parse it as
 * JSON and validate against these. If validation fails we retry once, then
 * fail the battle with an honest error and refund the credit — we never render
 * a half-built result off malformed AI output.
 *
 * No Convex imports here on purpose: these schemas are shared by the runAI()
 * router and can be unit-tested directly.
 */

const personaIdSchema = z.enum(["skimmer", "skeptic", "sharer", "buyer"]);

/** Call 1 — persona scoring. One entry per (hook x persona). */
export const scoringSchema = z.object({
  results: z
    .array(
      z.object({
        hookId: z.string(),
        persona: personaIdSchema,
        score: z.number().min(0).max(100),
        strongestReason: z.string().min(1).max(280),
        weakestReason: z.string().min(1).max(280),
      }),
    )
    .min(1),
});
export type ScoringResult = z.infer<typeof scoringSchema>;

/** Call 2 — 3 rewrites of the winning hook. */
export const rewritesSchema = z.object({
  rewrites: z
    .array(
      z.object({
        style: z.string().min(1).max(40),
        text: z.string().min(1).max(400),
      }),
    )
    .length(3),
});
export type RewritesResult = z.infer<typeof rewritesSchema>;

/** Call 3 — the share-card caption. */
export const captionSchema = z.object({
  caption: z.string().min(1).max(200),
});
export type CaptionResult = z.infer<typeof captionSchema>;
