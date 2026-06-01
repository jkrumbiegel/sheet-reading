const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B within an octave
const BLACK_KEYS = [
  { semitone: 1, afterWhite: 0 }, // C#
  { semitone: 3, afterWhite: 1 }, // D#
  { semitone: 6, afterWhite: 3 }, // F#
  { semitone: 8, afterWhite: 4 }, // G#
  { semitone: 10, afterWhite: 5 }, // A#
];

/**
 * Render a tappable piano keyboard spanning `octaves` octaves from `startMidi`
 * (a C). Pointer down/up report the key's MIDI number, so a finger tap on mobile
 * behaves exactly like a physical key press and release.
 */
export function buildPiano(
  container: HTMLElement,
  startMidi: number,
  octaves: number,
  onNote: (midi: number) => void,
  onRelease: (midi: number) => void,
): void {
  container.innerHTML = "";
  const whiteCount = octaves * 7 + 1; // trailing C to close the last octave

  const bindKey = (el: HTMLElement, midi: number) => {
    const press = (e: PointerEvent) => {
      e.preventDefault();
      el.classList.add("active");
      onNote(midi);
    };
    const release = () => {
      el.classList.remove("active");
      onRelease(midi);
    };
    el.addEventListener("pointerdown", press);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", release);
  };

  for (let i = 0; i < whiteCount; i++) {
    const midi = startMidi + Math.floor(i / 7) * 12 + WHITE_SEMITONES[i % 7]!;
    const key = document.createElement("div");
    key.className = "key white";
    key.style.width = `${100 / whiteCount}%`;
    bindKey(key, midi);
    container.append(key);
  }

  for (let octave = 0; octave < octaves; octave++) {
    for (const black of BLACK_KEYS) {
      const midi = startMidi + octave * 12 + black.semitone;
      const whiteIndex = octave * 7 + black.afterWhite;
      const key = document.createElement("div");
      key.className = "key black";
      key.style.left = `${((whiteIndex + 1) * 100) / whiteCount}%`;
      key.style.width = `${(100 / whiteCount) * 0.62}%`;
      bindKey(key, midi);
      container.append(key);
    }
  }
}
