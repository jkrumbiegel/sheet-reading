import { Renderer, Stave, StaveNote, StaveConnector, Accidental, Voice, Formatter } from "vexflow";
import type { SpelledNote } from "../domain/note";
import { noteToMidi } from "../domain/note";
import type { NoteStatus } from "../domain/session";

const COLORS: Record<NoteStatus, string> = {
  pending: "#1a1a1a",
  correct: "#1a9e3b",
  wrong: "#d12b2b",
};

const WIDTH = 280;
const HEIGHT = 240;

function accidentalGlyph(alter: number): string | null {
  if (alter === 1) return "#";
  if (alter === -1) return "b";
  return null;
}

/** Draw a single note on a grand staff, coloured by its status. */
export function renderNote(container: HTMLDivElement, note: SpelledNote, status: NoteStatus): void {
  container.innerHTML = "";

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(WIDTH, HEIGHT);
  const ctx = renderer.getContext();

  const treble = new Stave(10, 20, WIDTH - 40).addClef("treble");
  const bass = new Stave(10, 120, WIDTH - 40).addClef("bass");
  treble.setContext(ctx).draw();
  bass.setContext(ctx).draw();
  new StaveConnector(treble, bass).setType("brace").setContext(ctx).draw();
  new StaveConnector(treble, bass).setType("singleLeft").setContext(ctx).draw();

  const onTreble = noteToMidi(note) >= 60;
  const stave = onTreble ? treble : bass;
  const clef = onTreble ? "treble" : "bass";

  const staveNote = new StaveNote({
    keys: [`${note.step.toLowerCase()}/${note.octave}`],
    duration: "w",
    clef,
  });

  const glyph = accidentalGlyph(note.alter);
  if (glyph) staveNote.addModifier(new Accidental(glyph), 0);

  const color = COLORS[status];
  staveNote.setStyle({ fillStyle: color, strokeStyle: color });

  const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
  voice.addTickables([staveNote]);
  new Formatter().joinVoices([voice]).format([voice], WIDTH - 120);
  voice.draw(ctx, stave);
}

export function renderMessage(container: HTMLDivElement, message: string): void {
  container.innerHTML = `<div class="staff-message">${message}</div>`;
}
