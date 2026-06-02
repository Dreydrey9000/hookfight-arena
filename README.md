# HookFight Arena

**Paste your social hooks → 4 AI audience personas score & roast them → they fight down to a winner in a bracket → you get 3 sharper rewrites + a shareable card.**

It's a hook-testing game whose output is a screenshot people want to post — which is the marketing engine for the product itself.

This is **Build #1** of a 7-app slate, and it deliberately **forges the shared chassis** every later web app copies-and-skins: Next.js + Convex + Convex Auth + Stripe + the `runAI()` model router + credit-metering + the preview-before-paid gate + OG share cards.

---

## The flow

```
Landing (/)  →  Setup (/new)  →  burn 1 credit  →  AI persona scoring (runAI)
                                                          │
        share card + /b/<slug>  ←  Results (/b/<id>)  ←  bracket (pure code)
                     │
                     └──► new visitor → "Run your own hooks" → back to Setup   (the viral loop)
```

## Stack — and why

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | One framework for UI + API + serverless AI calls; free on Vercel Hobby. |
| Database | **Convex** | Typed DB + reactive queries + crons in one; the "battle running → results" updates feel live for free. |
| Auth | **Convex Auth** (`@convex-dev/auth`) | Built into Convex — no third-party auth service. Anonymous-friendly so a visitor runs 1 battle before sign-up. |
| Payments | **Stripe Checkout** | Hosted page = least code, PCI handled; we only verify the webhook signature. |
| Validation | **Zod** | Every AI response is validated; bad JSON fails the battle cleanly instead of rendering half a bracket. |
| Share card | **`next/og`** (built into Next 16) | Generates the screenshot artifact from HTML at the edge — this IS the viral loop. |
| Styling | **Tailwind 4** | Fast, consistent, no CSS-in-JS (house rule). |

## Setup

> Requires Node 24+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local      # then fill in the keys below
pnpm convex                     # first run logs you in + provisions the dev DB
pnpm dev                        # http://localhost:3000
```

### Environment variables (`.env.local`)

See `.env.example` for the annotated list. You need accounts for:

- **Convex** — `pnpm convex` writes `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` for you.
- **Convex Auth** — no external service; secrets live in Convex env (`npx convex env set ...`). Only `SITE_URL` lives here.
- **AI provider** — `AI_API_KEY` (+ optional `AI_MODEL`, `AI_BASE_URL`). Any OpenAI-compatible endpoint.
- **Stripe** (dashboard.stripe.com, TEST mode) — `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Run the app locally. |
| `pnpm convex` | Run the Convex dev backend (codegen + live sync). |
| `pnpm build` | Production build (typecheck + lint + compile). |
| `pnpm test` | Run the unit tests (`node --test` via tsx). |
| `pnpm lint` | ESLint. |

## Project layout

```
convex/
  schema.ts       6 tables: users, battles, hooks, personaVotes, rewrites, shareCards
  personas.ts     the 4 fixed personas + scoring rubric (the product's opinion)
  bracket.ts      pure single-elimination bracket — computed from scores, $0 of AI
  aiSchemas.ts    Zod schemas for every AI response
  runAI.ts        THE chassis: one model router, validated JSON, retry-once, stub mode
src/
  app/page.tsx    landing + static demo bracket
  app/new/page.tsx  battle setup form (paste hooks + audience + platform)
  lib/            constants (platforms/audiences/starters) + parseHooks helper
test/
  bracket.test.ts  unit tests for the bracket logic
```

## Status (2026-06-02 — Day 1 of the weekend build)

**Done & verified:** scaffold, schema, personas, bracket logic (6/6 tests pass), `runAI()` router with stub mode, the `/new` setup form + landing — `pnpm build` is green.

**Needs your keys / next session:** `pnpm convex` to deploy the schema; AI + Stripe keys in `.env.local`; install + wire **Convex Auth** (`@convex-dev/auth`); then build the create-battle mutation, the persona-scoring call, the results screen, the OG share card, credit-metering, and Stripe Checkout (Days 2–3 in `~/Desktop/manus-burn-20260602/frivolous/PLAN.md`).

> **Next 16 note:** auth middleware goes in `proxy.ts` (not `middleware.ts`), and `cookies`/`headers`/`params` are async. Wire Convex Auth's `convexAuthNextjsMiddleware` in `proxy.ts` when you add the auth gate.
