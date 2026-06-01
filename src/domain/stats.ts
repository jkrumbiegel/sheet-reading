export interface NoteStat {
  correct: number;
  wrong: number;
}

/** Per-note tally keyed by the written note's MIDI number (its staff position). */
export type Stats = Record<number, NoteStat>;

export function recordResult(stats: Stats, midi: number, correct: boolean): Stats {
  const prev = stats[midi] ?? { correct: 0, wrong: 0 };
  const next = {
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
  };
  return { ...stats, [midi]: next };
}

const SMOOTHING = 1; // Laplace prior: an unseen note reads as 50% hard
export const MIN_WEIGHT = 0.1; // floor so mastered notes still turn up occasionally

/** Smoothed miss-rate in [0, 1]; higher means harder. */
export function difficulty(stat: NoteStat | undefined): number {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  return (wrong + SMOOTHING) / (correct + wrong + 2 * SMOOTHING);
}

/** Sampling weight biased toward harder notes, with a floor for the easy ones. */
export function noteWeight(stat: NoteStat | undefined): number {
  return MIN_WEIGHT + difficulty(stat);
}
