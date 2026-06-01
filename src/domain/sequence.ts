import type { SpelledNote } from "./note";
import { noteToMidi } from "./note";
import type { Rng } from "./rng";

function candidatesFarFrom(
  notes: SpelledNote[],
  prevMidi: number | null,
  minInterval: number,
): SpelledNote[] {
  if (notes.length === 0) throw new Error("no candidate notes in the pool");
  const candidates =
    prevMidi === null
      ? notes
      : notes.filter((n) => Math.abs(noteToMidi(n) - prevMidi) >= minInterval);
  if (candidates.length === 0) {
    throw new Error(
      `no candidate note at least ${minInterval} semitones from the previous note`,
    );
  }
  return candidates;
}

/**
 * Pick a note from the pool at least `minInterval` semitones from `prevMidi`,
 * sampled in proportion to `weightOf` so harder notes come up more often. The
 * distance constraint forces far jumps so you read each note on its own.
 */
export function pickWeightedNote(
  notes: SpelledNote[],
  prevMidi: number | null,
  minInterval: number,
  weightOf: (note: SpelledNote) => number,
  rng: Rng,
): SpelledNote {
  const candidates = candidatesFarFrom(notes, prevMidi, minInterval);
  const weights = candidates.map(weightOf);
  const total = weights.reduce((a, b) => a + b, 0);

  let r = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}

/** Uniform pick — every eligible note equally likely. */
export function pickNote(
  notes: SpelledNote[],
  prevMidi: number | null,
  minInterval: number,
  rng: Rng,
): SpelledNote {
  return pickWeightedNote(notes, prevMidi, minInterval, () => 1, rng);
}
