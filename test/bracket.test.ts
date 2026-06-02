import { test } from "node:test";
import assert from "node:assert/strict";
import { generateBracket, type Entrant } from "../convex/bracket.ts";

const e = (hookId: string, score: number): Entrant => ({ hookId, score });

test("single entrant wins by default, no rounds", () => {
  const b = generateBracket([e("a", 50)]);
  assert.equal(b.winnerHookId, "a");
  assert.equal(b.rounds.length, 0);
});

test("two entrants: higher score wins in one round", () => {
  const b = generateBracket([e("lo", 40), e("hi", 90)]);
  assert.equal(b.winnerHookId, "hi");
  assert.equal(b.rounds.length, 1);
  assert.equal(b.rounds[0].length, 1);
});

test("three entrants: top seed gets a bye, then wins", () => {
  const b = generateBracket([e("top", 95), e("mid", 70), e("low", 30)]);
  // 3 entrants -> bracket size 4 -> 2 rounds (semis + final)
  assert.equal(b.rounds.length, 2);
  assert.equal(b.winnerHookId, "top");
  // First round must contain exactly one bye (the 4th slot is empty).
  const byes = b.rounds[0].filter((m) => m.b === null);
  assert.equal(byes.length, 1);
});

test("four entrants: #1 and #2 seeds only meet in the final", () => {
  const b = generateBracket([
    e("s1", 100),
    e("s2", 90),
    e("s3", 80),
    e("s4", 70),
  ]);
  assert.equal(b.rounds.length, 2);
  // Final is the last round, single match between the two top seeds.
  const final = b.rounds[b.rounds.length - 1];
  assert.equal(final.length, 1);
  const finalists = [final[0].a, final[0].b];
  assert.ok(finalists.includes("s1"));
  assert.ok(finalists.includes("s2"));
  assert.equal(b.winnerHookId, "s1");
});

test("highest overall score always wins the whole bracket", () => {
  const b = generateBracket([
    e("a", 12),
    e("b", 88),
    e("c", 45),
    e("d", 67),
    e("e", 91),
  ]);
  assert.equal(b.winnerHookId, "e");
});

test("empty input throws (caller bug, not a silent empty result)", () => {
  assert.throws(() => generateBracket([]), /no entrants/);
});
