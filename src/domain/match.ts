export type MatchResult = "correct" | "wrong";

export interface MatchOptions {
  /** Compare pitch class only, disregarding which octave was played. */
  ignoreOctave?: boolean;
}

export function matchPitch(
  expectedMidi: number,
  playedMidi: number,
  options: MatchOptions = {},
): MatchResult {
  if (options.ignoreOctave) {
    return ((expectedMidi % 12) + 12) % 12 === ((playedMidi % 12) + 12) % 12
      ? "correct"
      : "wrong";
  }
  return expectedMidi === playedMidi ? "correct" : "wrong";
}
