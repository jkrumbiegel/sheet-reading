import type { Step, Alter, SpelledNote } from "./note";
import { naturalPitchClass } from "./note";

export type Mode = "major";

export interface Scale {
  tonic: { step: Step; alter: Alter };
  mode: Mode;
}

export interface PitchRange {
  minMidi: number;
  maxMidi: number;
}

type LetterSpelling = { step: Step; alter: Alter };

const LETTERS: Step[] = ["C", "D", "E", "F", "G", "A", "B"];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const SHARP_TABLE: LetterSpelling[] = [
  { step: "C", alter: 0 },
  { step: "C", alter: 1 },
  { step: "D", alter: 0 },
  { step: "D", alter: 1 },
  { step: "E", alter: 0 },
  { step: "F", alter: 0 },
  { step: "F", alter: 1 },
  { step: "G", alter: 0 },
  { step: "G", alter: 1 },
  { step: "A", alter: 0 },
  { step: "A", alter: 1 },
  { step: "B", alter: 0 },
];

const FLAT_TABLE: LetterSpelling[] = [
  { step: "C", alter: 0 },
  { step: "D", alter: -1 },
  { step: "D", alter: 0 },
  { step: "E", alter: -1 },
  { step: "E", alter: 0 },
  { step: "F", alter: 0 },
  { step: "G", alter: -1 },
  { step: "G", alter: 0 },
  { step: "A", alter: -1 },
  { step: "A", alter: 0 },
  { step: "B", alter: -1 },
  { step: "B", alter: 0 },
];

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** The seven letter+accidental pairs of the scale, ordered from the tonic. */
export function scaleSpelling(scale: Scale): LetterSpelling[] {
  const tonicLetterIndex = LETTERS.indexOf(scale.tonic.step);
  const tonicPc = naturalPitchClass(scale.tonic.step) + scale.tonic.alter;

  return MAJOR_INTERVALS.map((interval, degree) => {
    const step = LETTERS[(tonicLetterIndex + degree) % 7]!;
    const targetPc = mod12(tonicPc + interval);
    const raw = targetPc - naturalPitchClass(step);
    const alter = (mod12(raw + 6) - 6) as Alter;
    return { step, alter };
  });
}

/** Spell an arbitrary MIDI number, choosing sharps or flats by preference. */
export function spellMidi(midi: number, preferFlat: boolean): SpelledNote {
  const spelling = (preferFlat ? FLAT_TABLE : SHARP_TABLE)[mod12(midi)]!;
  const octave = (midi - naturalPitchClass(spelling.step) - spelling.alter) / 12 - 1;
  return { step: spelling.step, alter: spelling.alter, octave };
}

export function keyPrefersFlats(scale: Scale): boolean {
  return scaleSpelling(scale).some((s) => s.alter < 0);
}

function spellingByPitchClass(scale: Scale, includeAccidentals: boolean): Map<number, LetterSpelling> {
  const byPc = new Map<number, LetterSpelling>();
  for (const s of scaleSpelling(scale)) {
    byPc.set(mod12(naturalPitchClass(s.step) + s.alter), s);
  }

  if (includeAccidentals) {
    const preferFlat = [...byPc.values()].some((s) => s.alter < 0);
    const table = preferFlat ? FLAT_TABLE : SHARP_TABLE;
    for (let pc = 0; pc < 12; pc++) {
      if (!byPc.has(pc)) byPc.set(pc, table[pc]!);
    }
  }

  return byPc;
}

/** All allowed notes within the range, ascending, spelled per the scale's key. */
export function allowedNotes(
  scale: Scale,
  includeAccidentals: boolean,
  range: PitchRange,
): SpelledNote[] {
  const byPc = spellingByPitchClass(scale, includeAccidentals);
  const notes: SpelledNote[] = [];

  for (let midi = range.minMidi; midi <= range.maxMidi; midi++) {
    const spelling = byPc.get(mod12(midi));
    if (!spelling) continue;
    const octave = (midi - naturalPitchClass(spelling.step) - spelling.alter) / 12 - 1;
    notes.push({ step: spelling.step, alter: spelling.alter, octave });
  }

  return notes;
}
