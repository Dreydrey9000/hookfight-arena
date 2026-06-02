/**
 * The 4 fixed audience personas + the shared scoring rubric.
 *
 * These ARE the product's point of view. The whole viral mechanic dies if the
 * output is generic, so each persona is deliberately narrow and opinionated:
 * one lens, one thing it rewards, one thing it punishes. "Accurate, not polite."
 *
 * This file is app-specific to HookFight — it does NOT carry forward to the
 * chassis. The runAI() router and credit-metering do; the personas don't.
 */

export type PersonaId = "skimmer" | "skeptic" | "sharer" | "buyer";

export interface Persona {
  id: PersonaId;
  name: string;
  /** One sentence the model adopts as its mindset. */
  lens: string;
  /** What pulls a score up for this persona. */
  rewards: string;
  /** What tanks a score for this persona. */
  punishes: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "skimmer",
    name: "The Skimmer",
    lens: "You are scrolling at speed and stop for nothing that makes you work. You read the first 5 words and move on.",
    rewards: "instant clarity, a concrete promise, plain words you grasp in one glance",
    punishes: "jargon, vague abstraction, a hook you have to re-read to understand",
  },
  {
    id: "skeptic",
    name: "The Skeptic",
    lens: "You assume every hook is hype until it earns trust. You've seen every overpromise.",
    rewards: "specifics, proof, numbers, an honest claim a real person would stand behind",
    punishes: "hype words ('insane', 'secret', 'this changes everything'), unbacked superlatives",
  },
  {
    id: "sharer",
    name: "The Sharer",
    lens: "You only share things that make YOU look smart, early, or in-the-know to your audience.",
    rewards: "status, a fresh angle, a line people will quote, an idea that flatters the sharer",
    punishes: "generic takes, anything that's been said 1,000 times, low-status energy",
  },
  {
    id: "buyer",
    name: "The Buyer",
    lens: "You have money and a problem. You're scanning for whether this person can actually solve it.",
    rewards: "clear value, a problem you recognize as yours, a reason to click now",
    punishes: "no obvious benefit, entertainment with no payoff, unclear who it's for",
  },
];

/**
 * The visible scoring rubric. Every persona scores each hook 0-100, weighing
 * these six dimensions. Showing the rubric in the UI is what makes the result
 * feel fair and post-worthy instead of a black box.
 */
export const RUBRIC = [
  "clarity",
  "curiosity",
  "specificity",
  "credibility",
  "emotionalCharge",
  "shareability",
] as const;

export type RubricDimension = (typeof RUBRIC)[number];
