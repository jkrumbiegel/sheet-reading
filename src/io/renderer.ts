import { Renderer, Stave, StaveNote, StaveConnector, Accidental, Voice, Formatter } from "vexflow";
import type { SpelledNote } from "../domain/note";
import { noteToMidi } from "../domain/note";

export type NoteStatus = "pending" | "correct" | "wrong";

const COLORS: Record<NoteStatus, string> = {
  pending: "#1a1a1a",
  correct: "#1a9e3b",
  wrong: "#d12b2b",
};

const HEIGHT = 240;
const TREBLE_Y = 20;
const BASS_Y = 120;

/** Empty measures drawn between the clef and the note, to keep the note far from the clef. */
const EMPTY_MEASURES = 3;
const CLEF_MEASURE_WIDTH = 110;
const MEASURE_WIDTH = 80;
const LEFT_MARGIN = 28; // room for the brace, which is drawn left of the staves
const RIGHT_MARGIN = 10;

export interface RenderItem {
  note: SpelledNote;
  status: NoteStatus;
}

function accidentalGlyph(alter: number): string | null {
  if (alter === 1) return "#";
  if (alter === -1) return "b";
  return null;
}

function makeStaveNote(item: RenderItem, clef: "treble" | "bass"): StaveNote {
  const staveNote = new StaveNote({
    keys: [`${item.note.step.toLowerCase()}/${item.note.octave}`],
    duration: "w",
    clef,
  });
  const glyph = accidentalGlyph(item.note.alter);
  if (glyph) staveNote.addModifier(new Accidental(glyph), 0);
  const color = COLORS[item.status];
  staveNote.setStyle({ fillStyle: color, strokeStyle: color });
  return staveNote;
}

/**
 * Draw the given notes on a grand staff, in the last of several measures so they
 * sit far from the clef — you can't lean on the clef's position as a reference.
 * Passing no items draws empty staves.
 */
export function renderNotes(container: HTMLDivElement, items: RenderItem[]): void {
  container.innerHTML = "";

  const measureWidths = [
    CLEF_MEASURE_WIDTH,
    ...Array<number>(EMPTY_MEASURES).fill(MEASURE_WIDTH),
  ];
  const width = LEFT_MARGIN + RIGHT_MARGIN + measureWidths.reduce((a, b) => a + b, 0);

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(width, HEIGHT);
  const ctx = renderer.getContext();

  const trebleStaves: Stave[] = [];
  const bassStaves: Stave[] = [];
  let x = LEFT_MARGIN;
  measureWidths.forEach((w, i) => {
    const treble = new Stave(x, TREBLE_Y, w);
    const bass = new Stave(x, BASS_Y, w);
    if (i === 0) {
      treble.addClef("treble");
      bass.addClef("bass");
    }
    treble.setContext(ctx).draw();
    bass.setContext(ctx).draw();
    trebleStaves.push(treble);
    bassStaves.push(bass);
    x += w;
  });

  new StaveConnector(trebleStaves[0]!, bassStaves[0]!).setType("brace").setContext(ctx).draw();
  new StaveConnector(trebleStaves[0]!, bassStaves[0]!).setType("singleLeft").setContext(ctx).draw();

  const lastIndex = measureWidths.length - 1;
  const byClef: Record<"treble" | "bass", StaveNote[]> = { treble: [], bass: [] };
  for (const item of items) {
    const clef = noteToMidi(item.note) >= 60 ? "treble" : "bass";
    byClef[clef].push(makeStaveNote(item, clef));
  }

  (["treble", "bass"] as const).forEach((clef) => {
    const notes = byClef[clef];
    if (notes.length === 0) return;
    const stave = (clef === "treble" ? trebleStaves : bassStaves)[lastIndex]!;
    const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], MEASURE_WIDTH - 20);
    voice.draw(ctx, stave);
  });
}

export function renderMessage(container: HTMLDivElement, message: string): void {
  container.innerHTML = `<div class="staff-message">${message}</div>`;
}
