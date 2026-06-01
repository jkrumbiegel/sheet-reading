export type Step = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** Semitone offset relative to C. Limited to single sharps/flats for now. */
export type Alter = -1 | 0 | 1;

export interface SpelledNote {
  step: Step;
  alter: Alter;
  octave: number;
}

const NATURAL_PITCH_CLASS: Record<Step, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function naturalPitchClass(step: Step): number {
  return NATURAL_PITCH_CLASS[step];
}

/** MIDI number with C4 = 60 (scientific pitch notation). */
export function noteToMidi(note: SpelledNote): number {
  return 12 * (note.octave + 1) + naturalPitchClass(note.step) + note.alter;
}

/** The MIDI number with the given pitch class that lies closest to `target`. */
export function nearestMidiWithPitchClass(pitchClass: number, target: number): number {
  const pc = ((pitchClass % 12) + 12) % 12;
  return pc + 12 * Math.round((target - pc) / 12);
}
