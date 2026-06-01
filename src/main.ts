import "./style.css";
import { allowedNotes } from "./domain/scale";
import { generateSequence } from "./domain/sequence";
import { startSession, playNote, type SessionState } from "./domain/session";
import { mulberry32 } from "./domain/rng";
import { renderNote, renderMessage } from "./io/renderer";
import { listenKeyboard } from "./io/keyboard";
import { listenMidi, type MidiStatus } from "./io/midi";
import { KEY_OPTIONS } from "./keys";

const RANGE = { minMidi: 48, maxMidi: 84 };
const GREEN_FLASH_MS = 350;

const settings = {
  keyIndex: 0,
  includeAccidentals: false,
  minInterval: 7,
  length: 20,
  baseOctave: 4,
  ignoreOctave: true,
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const staffEl = $<HTMLDivElement>("staff");
const progressEl = $("progress");
const midiStatusEl = $("midi-status");

let session: SessionState | null = null;

function newSequence() {
  const scale = KEY_OPTIONS[settings.keyIndex]!.scale;
  const pool = allowedNotes(scale, settings.includeAccidentals, RANGE);
  const sequence = generateSequence({
    notes: pool,
    minInterval: settings.minInterval,
    length: settings.length,
    rng: mulberry32(Date.now() >>> 0),
  });
  session = startSession(sequence);
  renderCurrent();
}

function renderCurrent() {
  if (!session) return;
  if (session.done) {
    renderMessage(staffEl, "Done — press “New sequence”.");
    progressEl.textContent = `${session.sequence.length} / ${session.sequence.length}`;
    return;
  }
  renderNote(staffEl, session.sequence[session.index]!, "pending");
  progressEl.textContent = `${session.index + 1} / ${session.sequence.length}`;
}

function onPlay(midi: number) {
  if (!session || session.done) return;
  const playedIndex = session.index;
  const note = session.sequence[playedIndex]!;
  session = playNote(session, midi, { ignoreOctave: settings.ignoreOctave });
  const status = session.statuses[playedIndex]!;

  renderNote(staffEl, note, status);
  if (status === "correct") window.setTimeout(renderCurrent, GREEN_FLASH_MS);
}

function bindControls() {
  const keySel = $<HTMLSelectElement>("key");
  KEY_OPTIONS.forEach((opt, i) => {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = opt.label;
    keySel.append(o);
  });
  keySel.value = String(settings.keyIndex);
  keySel.addEventListener("change", () => {
    settings.keyIndex = Number(keySel.value);
    newSequence();
  });

  const accidentals = $<HTMLInputElement>("accidentals");
  accidentals.checked = settings.includeAccidentals;
  accidentals.addEventListener("change", () => {
    settings.includeAccidentals = accidentals.checked;
    newSequence();
  });

  const minInterval = $<HTMLInputElement>("minInterval");
  const minIntervalOut = $<HTMLOutputElement>("minIntervalOut");
  minInterval.value = String(settings.minInterval);
  minIntervalOut.textContent = String(settings.minInterval);
  minInterval.addEventListener("input", () => {
    settings.minInterval = Number(minInterval.value);
    minIntervalOut.textContent = minInterval.value;
  });
  minInterval.addEventListener("change", newSequence);

  const length = $<HTMLInputElement>("length");
  length.value = String(settings.length);
  length.addEventListener("change", () => {
    settings.length = Math.max(1, Number(length.value));
    newSequence();
  });

  const baseOctave = $<HTMLInputElement>("baseOctave");
  baseOctave.value = String(settings.baseOctave);
  baseOctave.addEventListener("change", () => {
    settings.baseOctave = Number(baseOctave.value);
  });

  const ignoreOctave = $<HTMLInputElement>("ignoreOctave");
  ignoreOctave.checked = settings.ignoreOctave;
  ignoreOctave.addEventListener("change", () => {
    settings.ignoreOctave = ignoreOctave.checked;
  });

  $("new").addEventListener("click", newSequence);
}

function showMidiStatus(status: MidiStatus) {
  if (status.kind === "unsupported") {
    midiStatusEl.textContent = "MIDI: not supported in this browser (use the computer keyboard).";
  } else if (status.kind === "denied") {
    midiStatusEl.textContent = "MIDI: access denied.";
  } else {
    midiStatusEl.textContent = status.devices.length
      ? `MIDI: ${status.devices.join(", ")}`
      : "MIDI: ready (no device connected yet).";
  }
}

bindControls();
listenKeyboard(() => settings.baseOctave, onPlay);
void listenMidi(onPlay, showMidiStatus);
newSequence();
