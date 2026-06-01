import { describe, it, expect } from "vitest";
import { recordResult, difficulty, noteWeight, MIN_WEIGHT } from "../src/domain/stats";

describe("recordResult", () => {
  it("starts a note's tally on first sighting", () => {
    expect(recordResult({}, 60, true)).toEqual({ 60: { correct: 1, wrong: 0 } });
    expect(recordResult({}, 60, false)).toEqual({ 60: { correct: 0, wrong: 1 } });
  });

  it("accumulates without touching other notes", () => {
    const s = recordResult({ 67: { correct: 2, wrong: 1 } }, 60, true);
    expect(s).toEqual({ 67: { correct: 2, wrong: 1 }, 60: { correct: 1, wrong: 0 } });
  });
});

describe("difficulty", () => {
  it("rates an unseen note as moderately hard (0.5)", () => {
    expect(difficulty(undefined)).toBeCloseTo(0.5);
  });

  it("rates a mastered note as easy", () => {
    expect(difficulty({ correct: 10, wrong: 0 })).toBeLessThan(0.1);
  });

  it("rates an often-missed note as hard", () => {
    expect(difficulty({ correct: 0, wrong: 10 })).toBeGreaterThan(0.9);
  });

  it("increases monotonically with the share of misses", () => {
    expect(difficulty({ correct: 8, wrong: 2 })).toBeLessThan(difficulty({ correct: 2, wrong: 8 }));
  });
});

describe("noteWeight", () => {
  it("keeps a floor so easy notes still appear", () => {
    expect(noteWeight({ correct: 100, wrong: 0 })).toBeGreaterThanOrEqual(MIN_WEIGHT);
  });

  it("weights a hard note well above an easy one", () => {
    expect(noteWeight({ correct: 0, wrong: 10 })).toBeGreaterThan(noteWeight({ correct: 10, wrong: 0 }) * 3);
  });
});
