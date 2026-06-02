# Changelog

All notable changes to HookFight Arena are documented here.
Format: `## [YYYY-MM-DD]` with Added/Changed/Fixed/Removed. One line per change, including the *why*.

## [2026-06-02]

### Deployed
- **LIVE in production: https://hookfight-arena.vercel.app** (Vercel team `dreys-projects-277f634a`). Convex prod `merry-ibex-277` with Groq env set; Vercel build-time `NEXT_PUBLIC_CONVEX_URL` → prod. Verified end-to-end: live browser client scores a battle through CSP, real Groq output, no secrets in bundle, all security headers present.
- Added security headers (CSP allowing `*.convex.cloud` wss/https, X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-Policy) via `next.config` headers().
- Provisioned Convex prod via CLI (no dashboard `CONVEX_DEPLOY_KEY` needed) — Vercel build points at the fixed prod URL. Tradeoff: future schema changes need a manual `npx convex deploy`.


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
