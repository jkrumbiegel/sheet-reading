import { noteToMidi } from "../domain/note";

/** Semitone offset from the base-octave C for each mapped computer key. */
const KEY_OFFSETS: Record<string, number> = {
  a: 0, // C
  w: 1, // C#
  s: 2, // D
  e: 3, // D#
  d: 4, // E
  f: 5, // F
  t: 6, // F#
  g: 7, // G
  y: 8, // G#
  h: 9, // A
  u: 10, // A#
  j: 11, // B
  k: 12, // C (next octave)
};

export function keyToMidi(key: string, baseOctave: number): number | null {
  const offset = KEY_OFFSETS[key.toLowerCase()];
  if (offset === undefined) return null;
  return noteToMidi({ step: "C", alter: 0, octave: baseOctave }) + offset;
}

/** Listen for mapped key presses and report their MIDI numbers. Returns a disposer. */
export function listenKeyboard(
  getBaseOctave: () => number,
  onNote: (midi: number) => void,
): () => void {
  const handler = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const midi = keyToMidi(event.key, getBaseOctave());
    if (midi === null) return;
    event.preventDefault();
    onNote(midi);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}
