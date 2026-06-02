import { Soundfont, type StopFn } from "smplr";

let context: AudioContext | null = null;
let piano: ReturnType<typeof Soundfont> | null = null;
const active = new Map<number, StopFn>();

/**
 * Lazily create the audio context and load the GM grand piano on first use,
 * resuming the context within the user gesture that called us (autoplay policy).
 */
function ensurePiano() {
  if (!context) {
    context = new AudioContext();
    piano = Soundfont(context, { instrument: "acoustic_grand_piano" });
  }
  if (context.state === "suspended") void context.resume();
  return piano!;
}

/**
 * Sound `pitch`, tracked under `key` (the input note) so the matching release
 * stops it even when the sounded pitch was transposed to another octave.
 */
export function playAudio(key: number, pitch: number) {
  const instrument = ensurePiano();
  active.get(key)?.(); // retrigger: silence any still-ringing voice for this key
  active.set(key, instrument.start({ note: pitch, velocity: 100 }));
}

export function stopAudio(key: number) {
  const stop = active.get(key);
  if (!stop) return;
  stop();
  active.delete(key);
}
