/**
 * Shared UI constants for the battle setup form.
 *
 * Audience + platform are free-form on the backend (v.string()), but we offer
 * curated presets so a first-time user gets a sharp result without thinking.
 */

export const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X / Twitter" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "email", label: "Email subject" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const AUDIENCE_PRESETS = [
  "B2B founders on LinkedIn",
  "Creators & solopreneurs on X",
  "Ecommerce shoppers on Instagram",
  "Gen-Z scrollers on TikTok",
  "Developers evaluating a tool",
  "Marketers looking for an edge",
] as const;

/** A starter hook block per platform — gives the textarea a real example. */
export const STARTER_HOOKS: Record<PlatformId, string> = {
  linkedin: `Most "personal brands" are just resumes with better fonts.
I grew a newsletter to 10k with zero ads. Here's the ugly version.
Everyone says "post consistently." Nobody says what to post.`,
  x: `you don't have a productivity problem. you have a 47-open-tabs problem.
i deleted 90% of my saas tools last month. revenue went up.
the best growth hack is shipping something people actually want.`,
  instagram: `the $12 product that replaced my $400 skincare shelf
i tried every viral recipe for 30 days so you don't have to
this is your sign to cancel the subscription you forgot about`,
  tiktok: `POV: you finally found the budgeting app that doesn't judge you
nobody told me adulting was just googling things at 2am
i quit my 9-5 and this is what week one actually looked like`,
  youtube: `I Tried Every AI Coding Tool So You Don't Have To
Why Your First $1,000 Online Is The Hardest (And How To Get It)
The Productivity System I Wish I Had At 22`,
  email: `You're leaving money in your cart (literally)
The 3-minute fix for your worst email habit
I almost didn't send this one`,
};

export const HOOKS_MIN = 2;
export const HOOKS_MAX = 10;
export const HOOK_MAX_LEN = 280; // truncate guard — a paste-bomb can't blow up cost
