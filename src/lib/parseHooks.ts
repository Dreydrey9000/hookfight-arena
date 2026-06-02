import { HOOKS_MIN, HOOKS_MAX, HOOK_MAX_LEN } from "./constants";

export interface ParseResult {
  hooks: string[];
  error: string | null;
}

/**
 * Turn the raw textarea (one hook per line) into a clean, validated list.
 *
 * - trims each line, drops blanks
 * - de-dupes exact repeats (case-insensitive) so a paste-bomb can't pad the count
 * - truncates any single hook to HOOK_MAX_LEN (cost guard)
 * - enforces the 2-10 count
 *
 * Pure + dependency-light so it runs identically in the form and on the server.
 */
export function parseHooks(raw: string): ParseResult {
  const seen = new Set<string>();
  const hooks: string[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hooks.push(trimmed.slice(0, HOOK_MAX_LEN));
    if (hooks.length >= HOOKS_MAX) break;
  }

  if (hooks.length < HOOKS_MIN) {
    return {
      hooks,
      error: `Add at least ${HOOKS_MIN} hooks (one per line). You have ${hooks.length}.`,
    };
  }

  return { hooks, error: null };
}
