import { describe, it, expect } from "vitest";
import { startSession, playNote } from "../src/domain/session";
import { noteToMidi, type SpelledNote } from "../src/domain/note";

const seq: SpelledNote[] = [
  { step: "C", alter: 0, octave: 4 }, // 60
  { step: "G", alter: 0, octave: 4 }, // 67
  { step: "E", alter: 0, octave: 5 }, // 76
];
const midi = (i: number) => noteToMidi(seq[i]!);

describe("training session", () => {
  it("starts on the first note with everything pending", () => {
    const s = startSession(seq);
    expect(s.index).toBe(0);
    expect(s.statuses).toEqual(["pending", "pending", "pending"]);
    expect(s.done).toBe(false);
  });

  it("marks the current note correct and advances on a matching pitch", () => {
    const s = playNote(startSession(seq), midi(0));
    expect(s.statuses[0]).toBe("correct");
    expect(s.index).toBe(1);
    expect(s.done).toBe(false);
  });

  it("marks the current note wrong and stays put on a mismatch", () => {
    const s = playNote(startSession(seq), midi(0) + 1);
    expect(s.statuses[0]).toBe("wrong");
    expect(s.index).toBe(0);
  });

  it("recovers to correct after a wrong attempt on the same note", () => {
    let s = startSession(seq);
    s = playNote(s, midi(0) + 1);
    s = playNote(s, midi(0));
    expect(s.statuses[0]).toBe("correct");
    expect(s.index).toBe(1);
  });

  it("completes after the last note is played correctly", () => {
    let s = startSession(seq);
    s = playNote(s, midi(0));
    s = playNote(s, midi(1));
    s = playNote(s, midi(2));
    expect(s.done).toBe(true);
    expect(s.statuses).toEqual(["correct", "correct", "correct"]);
  });

  it("ignores further input once done", () => {
    let s = startSession(seq);
    s = playNote(s, midi(0));
    s = playNote(s, midi(1));
    s = playNote(s, midi(2));
    const after = playNote(s, midi(0) + 1);
    expect(after).toEqual(s);
  });

  it("honours the ignoreOctave option", () => {
    const s = playNote(startSession(seq), midi(0) + 12, { ignoreOctave: true });
    expect(s.statuses[0]).toBe("correct");
  });
});
