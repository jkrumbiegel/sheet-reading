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

export function playAudio(midi: number) {
  const instrument = ensurePiano();
  active.get(midi)?.(); // retrigger: silence any still-ringing voice for this note
  active.set(midi, instrument.start({ note: midi, velocity: 100 }));
}

export function stopAudio(midi: number) {
  const stop = active.get(midi);
  if (!stop) return;
  stop();
  active.delete(midi);
}
