import type { SpelledNote } from "./note";
import { noteToMidi } from "./note";
import type { Rng } from "./rng";

export interface SequenceOptions {
  notes: SpelledNote[];
  /** Minimum semitone distance required between consecutive notes. */
  minInterval: number;
  length: number;
  rng: Rng;
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

/**
 * Random walk over the allowed notes where each step jumps at least
 * `minInterval` semitones from the previous note — the anti-cheating
 * constraint that forces reading each note rather than adjusting locally.
 */
export function generateSequence(options: SequenceOptions): SpelledNote[] {
  const { notes, minInterval, length, rng } = options;
  if (notes.length === 0) throw new Error("no candidate notes in the pool");

  const result: SpelledNote[] = [];
  let prevMidi: number | null = null;

  for (let i = 0; i < length; i++) {
    const candidates =
      prevMidi === null
        ? notes
        : notes.filter((n) => Math.abs(noteToMidi(n) - prevMidi!) >= minInterval);

    if (candidates.length === 0) {
      throw new Error(
        `no candidate note at least ${minInterval} semitones from the previous note`,
      );
    }

    const next = pick(candidates, rng);
    result.push(next);
    prevMidi = noteToMidi(next);
  }

  return result;
}
