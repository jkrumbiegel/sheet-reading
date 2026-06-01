import type { SpelledNote } from "./note";
import { noteToMidi } from "./note";
import { matchPitch, type MatchOptions } from "./match";

export type NoteStatus = "pending" | "correct" | "wrong";

export interface SessionState {
  sequence: SpelledNote[];
  index: number;
  statuses: NoteStatus[];
  done: boolean;
}

export function startSession(sequence: SpelledNote[]): SessionState {
  return {
    sequence,
    index: 0,
    statuses: sequence.map(() => "pending"),
    done: sequence.length === 0,
  };
}

/** Apply a played pitch to the session, advancing only on a correct match. */
export function playNote(
  state: SessionState,
  playedMidi: number,
  options: MatchOptions = {},
): SessionState {
  if (state.done) return state;

  const expected = noteToMidi(state.sequence[state.index]!);
  const result = matchPitch(expected, playedMidi, options);

  const statuses = [...state.statuses];
  statuses[state.index] = result;

  if (result === "wrong") {
    return { ...state, statuses };
  }

  const index = state.index + 1;
  return { ...state, statuses, index, done: index >= state.sequence.length };
}
