/**
 * Single-elimination bracket — computed in pure code from persona scores.
 *
 * No AI call here: the personas produce scores, and the bracket is just a
 * deterministic tournament over those scores. That keeps cost at literally $0
 * for this step and makes it unit-testable (see test/bracket.test.ts).
 *
 * Lives in convex/ (not src/) because Convex only bundles convex/ — but it has
 * zero Convex-runtime imports, so the test file can import it directly too.
 */

export interface Entrant {
  hookId: string;
  score: number; // overall, averaged across the 4 personas
}

export interface Match {
  a: string; // hookId
  b: string | null; // null = bye (a advances automatically)
  winner: string; // hookId
}

export interface Bracket {
  rounds: Match[][]; // rounds[0] is the first round, last round is the final
  winnerHookId: string;
}

/** Next power of two >= n (1 -> 1, 3 -> 4, 5 -> 8). */
function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard tournament seeding order for a bracket of `size` (a power of two),
 * so the #1 and #2 seeds can only meet in the final. Returns 1-based seed
 * numbers in bracket-slot order, e.g. size 4 -> [1, 4, 3, 2].
 */
function seedOrder(size: number): number[] {
  let rounds: number[] = [1, 2];
  while (rounds.length < size) {
    const next: number[] = [];
    const sum = rounds.length * 2 + 1;
    for (const seed of rounds) {
      next.push(seed);
      next.push(sum - seed);
    }
    rounds = next;
  }
  return rounds;
}

/**
 * Decide a single match. A bye (b === null) advances `a`. Otherwise the higher
 * score wins; a tie is broken by seed order (the entrant passed as `a`, which
 * the caller always seeds higher).
 */
function resolve(a: Entrant, b: Entrant | null): Match {
  if (b === null) return { a: a.hookId, b: null, winner: a.hookId };
  const winner = b.score > a.score ? b.hookId : a.hookId;
  return { a: a.hookId, b: b.hookId, winner };
}

/**
 * Build the full bracket from scored entrants. Highest score is the #1 seed.
 * Throws on empty input — a battle with no hooks is a caller bug, not a
 * silently-empty result.
 */
export function generateBracket(entrants: Entrant[]): Bracket {
  if (entrants.length === 0) {
    throw new Error("generateBracket: no entrants");
  }
  if (entrants.length === 1) {
    return { rounds: [], winnerHookId: entrants[0].hookId };
  }

  // Rank by score desc; ties keep input order (stable enough for seeding).
  const ranked = [...entrants].sort((x, y) => y.score - x.score);
  const size = nextPowerOfTwo(ranked.length);

  // Place entrants into bracket slots by seed order; missing seeds are byes.
  const order = seedOrder(size);
  let current: (Entrant | null)[] = order.map((seed) =>
    seed <= ranked.length ? ranked[seed - 1] : null,
  );

  const rounds: Match[][] = [];
  while (current.length > 1) {
    const round: Match[] = [];
    const advancing: (Entrant | null)[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      // A bye-vs-bye slot can't happen for power-of-two seeding with >=2 real
      // entrants, but guard anyway: if a is null, b advances.
      if (a === null) {
        advancing.push(b);
        if (b !== null) round.push({ a: b.hookId, b: null, winner: b.hookId });
        continue;
      }
      const match = resolve(a, b);
      round.push(match);
      advancing.push(match.winner === a.hookId ? a : b);
    }
    rounds.push(round);
    current = advancing;
  }

  const winner = current[0];
  if (!winner) throw new Error("generateBracket: failed to resolve a winner");
  return { rounds, winnerHookId: winner.hookId };
}
