import { describe, it, expect } from "vitest";
import { generateSequence } from "../src/domain/sequence";
import { allowedNotes } from "../src/domain/scale";
import { noteToMidi } from "../src/domain/note";
import { mulberry32 } from "../src/domain/rng";

const cMajor = { tonic: { step: "C", alter: 0 }, mode: "major" } as const;
const pool = allowedNotes(cMajor, false, { minMidi: 48, maxMidi: 84 });

describe("generateSequence", () => {
  it("produces a sequence of the requested length", () => {
    const seq = generateSequence({ notes: pool, minInterval: 5, length: 10, rng: mulberry32(1) });
    expect(seq).toHaveLength(10);
  });

  it("keeps every consecutive pair at least minInterval semitones apart", () => {
    const seq = generateSequence({ notes: pool, minInterval: 7, length: 50, rng: mulberry32(42) });
    for (let i = 1; i < seq.length; i++) {
      expect(Math.abs(noteToMidi(seq[i]!) - noteToMidi(seq[i - 1]!))).toBeGreaterThanOrEqual(7);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateSequence({ notes: pool, minInterval: 5, length: 20, rng: mulberry32(7) });
    const b = generateSequence({ notes: pool, minInterval: 5, length: 20, rng: mulberry32(7) });
    expect(a).toEqual(b);
  });

  it("draws only from the allowed pool", () => {
    const seq = generateSequence({ notes: pool, minInterval: 5, length: 30, rng: mulberry32(3) });
    const poolMidis = new Set(pool.map(noteToMidi));
    for (const n of seq) expect(poolMidis.has(noteToMidi(n))).toBe(true);
  });

  it("throws when minInterval exceeds the pool's range", () => {
    expect(() =>
      generateSequence({ notes: pool, minInterval: 100, length: 5, rng: mulberry32(1) }),
    ).toThrow(/no candidate/i);
  });
});
