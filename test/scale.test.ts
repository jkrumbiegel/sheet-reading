import { describe, it, expect } from "vitest";
import { scaleSpelling, allowedNotes, spellMidi, keyPrefersFlats } from "../src/domain/scale";
import { noteToMidi } from "../src/domain/note";

const cMajor = { tonic: { step: "C", alter: 0 }, mode: "major" } as const;
const dMajor = { tonic: { step: "D", alter: 0 }, mode: "major" } as const;
const fMajor = { tonic: { step: "F", alter: 0 }, mode: "major" } as const;

describe("scaleSpelling", () => {
  it("spells C major with all naturals", () => {
    expect(scaleSpelling(cMajor)).toEqual([
      { step: "C", alter: 0 },
      { step: "D", alter: 0 },
      { step: "E", alter: 0 },
      { step: "F", alter: 0 },
      { step: "G", alter: 0 },
      { step: "A", alter: 0 },
      { step: "B", alter: 0 },
    ]);
  });

  it("spells D major with F# and C#", () => {
    expect(scaleSpelling(dMajor)).toEqual([
      { step: "D", alter: 0 },
      { step: "E", alter: 0 },
      { step: "F", alter: 1 },
      { step: "G", alter: 0 },
      { step: "A", alter: 0 },
      { step: "B", alter: 0 },
      { step: "C", alter: 1 },
    ]);
  });

  it("spells F major with Bb", () => {
    expect(scaleSpelling(fMajor)).toEqual([
      { step: "F", alter: 0 },
      { step: "G", alter: 0 },
      { step: "A", alter: 0 },
      { step: "B", alter: -1 },
      { step: "C", alter: 0 },
      { step: "D", alter: 0 },
      { step: "E", alter: 0 },
    ]);
  });
});

describe("allowedNotes", () => {
  const range = { minMidi: 60, maxMidi: 72 };

  it("yields the diatonic notes in range when accidentals are excluded", () => {
    const notes = allowedNotes(cMajor, false, range);
    expect(notes.map(noteToMidi)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });

  it("yields every chromatic note in range when accidentals are included", () => {
    const notes = allowedNotes(cMajor, true, range);
    expect(notes.map(noteToMidi)).toEqual([
      60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
    ]);
  });

  it("spells chromatic notes in a sharp/natural key with sharps", () => {
    const notes = allowedNotes(cMajor, true, { minMidi: 61, maxMidi: 61 });
    expect(notes).toEqual([{ step: "C", alter: 1, octave: 4 }]);
  });

  it("spells chromatic notes in a flat key with flats", () => {
    const notes = allowedNotes(fMajor, true, { minMidi: 70, maxMidi: 70 });
    expect(notes).toEqual([{ step: "B", alter: -1, octave: 4 }]);
  });

  it("returns notes sorted ascending by pitch", () => {
    const notes = allowedNotes(dMajor, true, range);
    const midis = notes.map(noteToMidi);
    expect([...midis].sort((a, b) => a - b)).toEqual(midis);
  });
});

describe("spellMidi", () => {
  it("spells naturals", () => {
    expect(spellMidi(60, false)).toEqual({ step: "C", alter: 0, octave: 4 });
    expect(spellMidi(59, false)).toEqual({ step: "B", alter: 0, octave: 3 });
  });

  it("spells black keys as sharps or flats per preference", () => {
    expect(spellMidi(61, false)).toEqual({ step: "C", alter: 1, octave: 4 });
    expect(spellMidi(61, true)).toEqual({ step: "D", alter: -1, octave: 4 });
    expect(spellMidi(70, false)).toEqual({ step: "A", alter: 1, octave: 4 });
    expect(spellMidi(70, true)).toEqual({ step: "B", alter: -1, octave: 4 });
  });
});

describe("keyPrefersFlats", () => {
  it("is false for C major and sharp keys", () => {
    expect(keyPrefersFlats(cMajor)).toBe(false);
    expect(keyPrefersFlats(dMajor)).toBe(false);
  });

  it("is true for flat keys", () => {
    expect(keyPrefersFlats(fMajor)).toBe(true);
  });
});
