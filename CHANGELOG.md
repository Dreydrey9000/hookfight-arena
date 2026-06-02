# Changelog

All notable changes to HookFight Arena are documented here.
Format: `## [YYYY-MM-DD]` with Added/Changed/Fixed/Removed. One line per change, including the *why*.

## [2026-06-02]

### Added
- Scaffolded Next.js 16 (App Router) + TypeScript + Tailwind 4 base — this is Build #1, the shared chassis every later web app reuses.
- Installed Convex (typed DB), Clerk (auth), Stripe (payments), Zod (runtime validation) — the house-default stack, so later apps copy + skin instead of re-choosing.
- Convex schema for the 6 core tables (`users`, `battles`, `hooks`, `personaVotes`, `rewrites`, `shareCards`) — the data spine of a battle.
- The 4 fixed audience personas + scoring rubric (`convex/personas.ts`) — the product's opinion; hand-tuned to be sharp, not bland (the #1 risk in the plan).
- Pure bracket-computation logic (`convex/bracket.ts`) — single-elimination winner is derived in code from persona scores, so it costs $0 of AI.
- `runAI()` router stub with Zod-validated JSON in/out — one place every future app swaps models; Day-1 deliverable is the validated stub before the real model call.

### Changed
- Pinned all dependency versions exactly (no `^`/`~`) and committed the lockfile — supply-chain hygiene + reproducible installs.
- Auth switched from Clerk to **Convex Auth** (`@convex-dev/auth`) — Drey's stack standard; no third-party auth service, secrets live in Convex env. Schema `users.clerkId` → `authUserId` (provider-neutral subject).

### Removed
- `@clerk/nextjs` dependency and all Clerk references — not used; replaced by Convex Auth (to be wired next session).
