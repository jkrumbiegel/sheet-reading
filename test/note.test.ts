import { describe, it, expect } from "vitest";
import { noteToMidi, naturalPitchClass } from "../src/domain/note";

describe("noteToMidi", () => {
  it("places middle C at MIDI 60", () => {
    expect(noteToMidi({ step: "C", alter: 0, octave: 4 })).toBe(60);
  });

  it("places A4 at MIDI 69", () => {
    expect(noteToMidi({ step: "A", alter: 0, octave: 4 })).toBe(69);
  });

  it("applies a sharp as +1 semitone", () => {
    expect(noteToMidi({ step: "C", alter: 1, octave: 4 })).toBe(61);
  });

  it("applies a flat as -1 semitone", () => {
    expect(noteToMidi({ step: "B", alter: -1, octave: 3 })).toBe(58);
  });
});

describe("naturalPitchClass", () => {
  it("maps the natural letters to their pitch classes", () => {
    expect(naturalPitchClass("C")).toBe(0);
    expect(naturalPitchClass("D")).toBe(2);
    expect(naturalPitchClass("E")).toBe(4);
    expect(naturalPitchClass("F")).toBe(5);
    expect(naturalPitchClass("G")).toBe(7);
    expect(naturalPitchClass("A")).toBe(9);
    expect(naturalPitchClass("B")).toBe(11);
  });
});
