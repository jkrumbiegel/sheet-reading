import { describe, it, expect } from "vitest";
import { matchPitch } from "../src/domain/match";

describe("matchPitch", () => {
  it("is correct when the played pitch equals the expected pitch", () => {
    expect(matchPitch(60, 60)).toBe("correct");
  });

  it("is wrong when the played pitch differs", () => {
    expect(matchPitch(60, 61)).toBe("wrong");
  });

  it("ignores octave when asked to", () => {
    expect(matchPitch(60, 72, { ignoreOctave: true })).toBe("correct");
    expect(matchPitch(60, 61, { ignoreOctave: true })).toBe("wrong");
  });

  it("treats enharmonic equivalents as the same pitch", () => {
    // C#4 (61) played against a stave showing Db4 (also 61)
    expect(matchPitch(61, 61)).toBe("correct");
  });
});
