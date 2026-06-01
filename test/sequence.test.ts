import { describe, it, expect } from "vitest";
import { pickNote, pickWeightedNote } from "../src/domain/sequence";
import { allowedNotes } from "../src/domain/scale";
import { noteToMidi } from "../src/domain/note";
import { mulberry32 } from "../src/domain/rng";

const cMajor = { tonic: { step: "C", alter: 0 }, mode: "major" } as const;
const pool = allowedNotes(cMajor, false, { minMidi: 48, maxMidi: 84 });
const poolMidis = new Set(pool.map(noteToMidi));

describe("pickNote", () => {
  it("draws from the allowed pool", () => {
    const note = pickNote(pool, null, 7, mulberry32(1));
    expect(poolMidis.has(noteToMidi(note))).toBe(true);
  });

  it("keeps every pick at least minInterval semitones from the previous note", () => {
    const rng = mulberry32(42);
    let prev = noteToMidi(pickNote(pool, null, 7, rng));
    for (let i = 0; i < 200; i++) {
      const next = noteToMidi(pickNote(pool, prev, 7, rng));
      expect(Math.abs(next - prev)).toBeGreaterThanOrEqual(7);
      prev = next;
    }
  });

  it("is deterministic for a given seed", () => {
    expect(pickNote(pool, 60, 5, mulberry32(7))).toEqual(pickNote(pool, 60, 5, mulberry32(7)));
  });

  it("throws when nothing in the pool is far enough away", () => {
    expect(() => pickNote(pool, 60, 100, mulberry32(1))).toThrow(/no candidate/i);
  });
});

describe("pickWeightedNote", () => {
  it("favours heavily-weighted notes", () => {
    const heavy = noteToMidi(pool[0]!);
    const weightOf = (n: (typeof pool)[number]) => (noteToMidi(n) === heavy ? 1000 : 1);
    const rng = mulberry32(99);
    let hits = 0;
    for (let i = 0; i < 200; i++) {
      if (noteToMidi(pickWeightedNote(pool, null, 1, weightOf, rng)) === heavy) hits++;
    }
    expect(hits).toBeGreaterThan(150);
  });

  it("still respects the distance constraint", () => {
    const rng = mulberry32(5);
    let prev = noteToMidi(pickWeightedNote(pool, null, 7, () => 1, rng));
    for (let i = 0; i < 100; i++) {
      const next = noteToMidi(pickWeightedNote(pool, prev, 7, () => 1, rng));
      expect(Math.abs(next - prev)).toBeGreaterThanOrEqual(7);
      prev = next;
    }
  });
});
