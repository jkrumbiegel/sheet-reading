import { Soundfont, type StopFn } from "smplr";

let context: AudioContext | null = null;
let piano: ReturnType<typeof Soundfont> | null = null;
const active = new Map<number, StopFn>();

function ensurePiano() {
  if (!context) {
    const Ctor = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    context = new Ctor();
    piano = Soundfont(context, { instrument: "acoustic_grand_piano" });
  }
  if (context.state === "suspended") void context.resume();
  return piano!;
}

/**
 * Unlock audio from within a user gesture. iOS keeps an AudioContext suspended
 * until something actually plays during a gesture; samples load asynchronously,
 * so we tick a silent buffer now to unlock before the first real note arrives.
 */
export function unlockAudio() {
  ensurePiano();
  const ctx = context!;
  const source = ctx.createBufferSource();
  source.buffer = ctx.createBuffer(1, 1, 22050);
  source.connect(ctx.destination);
  source.start(0);
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
