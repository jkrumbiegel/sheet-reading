import { describe, it, expect } from "vitest";
import { emptyScore, updateScore } from "../src/domain/score";

describe("score", () => {
  it("starts at zero", () => {
    expect(emptyScore()).toEqual({ streak: 0, best: 0 });
  });

  it("seeds the best from a stored value", () => {
    expect(emptyScore(7)).toEqual({ streak: 0, best: 7 });
  });

  it("increments the streak on a correct answer", () => {
    expect(updateScore({ streak: 2, best: 5 }, true)).toEqual({ streak: 3, best: 5 });
  });

  it("raises best when the streak overtakes it", () => {
    expect(updateScore({ streak: 5, best: 5 }, true)).toEqual({ streak: 6, best: 6 });
  });

  it("resets the streak to zero on a wrong answer, keeping best", () => {
    expect(updateScore({ streak: 4, best: 9 }, false)).toEqual({ streak: 0, best: 9 });
  });
});
