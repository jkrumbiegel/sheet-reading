import { describe, it, expect } from "vitest";
import { keyToMidi } from "../src/io/keyboard";

describe("keyToMidi", () => {
  it("maps the home row white keys to C major from the base octave", () => {
    expect(keyToMidi("a", 4)).toBe(60); // C4
    expect(keyToMidi("s", 4)).toBe(62); // D4
    expect(keyToMidi("d", 4)).toBe(64); // E4
    expect(keyToMidi("f", 4)).toBe(65); // F4
    expect(keyToMidi("g", 4)).toBe(67); // G4
    expect(keyToMidi("h", 4)).toBe(69); // A4
    expect(keyToMidi("j", 4)).toBe(71); // B4
    expect(keyToMidi("k", 4)).toBe(72); // C5
  });

  it("maps the upper row to the black keys", () => {
    expect(keyToMidi("w", 4)).toBe(61); // C#4
    expect(keyToMidi("e", 4)).toBe(63); // D#4
    expect(keyToMidi("t", 4)).toBe(66); // F#4
    expect(keyToMidi("y", 4)).toBe(68); // G#4
    expect(keyToMidi("u", 4)).toBe(70); // A#4
  });

  it("shifts with the base octave", () => {
    expect(keyToMidi("a", 3)).toBe(48);
    expect(keyToMidi("a", 5)).toBe(72);
  });

  it("is case-insensitive", () => {
    expect(keyToMidi("A", 4)).toBe(60);
  });

  it("returns null for unmapped keys", () => {
    expect(keyToMidi("z", 4)).toBeNull();
    expect(keyToMidi("1", 4)).toBeNull();
  });
});
