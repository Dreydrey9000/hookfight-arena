import { z } from "zod";

/**
 * runAI() — the shared model-routing function. THE chassis piece.
 *
 * Every AI call in this app (and every later app that copies the chassis) goes
 * through here, so swapping models or providers is a one-file change. It:
 *   1. sends a system + user prompt to an OpenAI-compatible chat endpoint,
 *   2. forces JSON output and parses it,
 *   3. validates against a Zod schema,
 *   4. retries exactly once on a bad/invalid response,
 *   5. then throws a clean RunAIError (caller fails the battle + refunds credit).
 *
 * Stub mode: if AI_API_KEY is unset and the caller passed a `stub`, we return
 * the stub instead of calling out. That lets the free loop be built and demoed
 * on Day 1 before any key exists — flip the key on and the real model takes over
 * with zero code changes.
 *
 * No Convex imports — this is portable and unit-testable on its own.
 */

export class RunAIError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RunAIError";
  }
}

export interface RunAIOptions<T> {
  /** Sets the model's role/voice. */
  system: string;
  /** The actual request payload (already length-capped by the caller). */
  user: string;
  /** Validates the parsed JSON. On failure we retry once, then throw. */
  schema: z.ZodType<T>;
  /** Deterministic fallback used only when AI_API_KEY is unset. */
  stub?: () => T;
  /** Hard cap on output tokens — the margin guardrail. */
  maxTokens?: number;
  /** Override the default model for this call. */
  model?: string;
}

interface ChatEnv {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
}

function readEnv(): ChatEnv {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.AI_MODEL ?? "gpt-4.1-mini",
  };
}

async function callOnce(
  env: ChatEnv,
  opts: RunAIOptions<unknown>,
): Promise<unknown> {
  const res = await fetch(`${env.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? env.model,
      max_tokens: opts.maxTokens ?? 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new RunAIError(`model HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new RunAIError("model returned empty content");

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new RunAIError("model returned non-JSON content", err);
  }
}

export async function runAI<T>(opts: RunAIOptions<T>): Promise<T> {
  const env = readEnv();

  // Stub mode for local dev before a key exists.
  if (!env.apiKey) {
    if (opts.stub) {
      console.warn("[runAI] AI_API_KEY unset — returning stub output");
      return opts.schema.parse(opts.stub());
    }
    throw new RunAIError("AI_API_KEY is not set and no stub was provided");
  }

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callOnce(env, opts);
      const parsed = opts.schema.safeParse(raw);
      if (parsed.success) return parsed.data;
      lastErr = parsed.error;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new RunAIError("model output failed validation after retry", lastErr);
}
