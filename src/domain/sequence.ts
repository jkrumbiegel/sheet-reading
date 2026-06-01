import type { SpelledNote } from "./note";
import { noteToMidi } from "./note";
import type { Rng } from "./rng";

/**
 * Pick a random note from the pool that lies at least `minInterval` semitones
 * from `prevMidi` (pass null for the first note). The distance constraint forces
 * far jumps so you read each note rather than adjusting from the previous one.
 */
export function pickNote(
  notes: SpelledNote[],
  prevMidi: number | null,
  minInterval: number,
  rng: Rng,
): SpelledNote {
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

  return candidates[Math.floor(rng() * candidates.length)]!;
}
