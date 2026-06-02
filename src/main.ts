import "./style.css";
import { allowedNotes, spellMidi, keyPrefersFlats } from "./domain/scale";
import { pickWeightedNote } from "./domain/sequence";
import { emptyScore, updateScore, type Score } from "./domain/score";
import { recordResult, noteWeight, type Stats } from "./domain/stats";
import { matchPitch } from "./domain/match";
import { nearestMidiWithPitchClass, noteToMidi, type SpelledNote } from "./domain/note";
import { mulberry32 } from "./domain/rng";
import { renderNotes } from "./io/renderer";
import { listenKeyboard } from "./io/keyboard";
import { listenMidi, type MidiStatus } from "./io/midi";
import { buildPiano } from "./io/piano";
import { playAudio, stopAudio } from "./io/audio";
import { KEY_OPTIONS } from "./keys";

const RANGE = { minMidi: 28, maxMidi: 93 }; // E1 .. A6
const LINGER_MS = 500; // how long the green correct note stays after the key is released
const PIANO_OCTAVES = 1;
const BEST_KEY = "sheet-reading.best";
const STATS_KEY = "sheet-reading.stats";

const settings = {
  keyIndex: 0,
  includeAccidentals: false,
  minInterval: 7,
  baseOctave: 4,
  ignoreOctave: true,
  sound: true,
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const staffEl = $<HTMLDivElement>("staff");
const pianoEl = $("piano");
const streakCurrentEl = $("streak-current");
const streakBestEl = $("streak-best");
const midiStatusEl = $("midi-status");

const rng = mulberry32((Date.now() ^ (performance.now() * 1000)) >>> 0);

let pool: SpelledNote[] = [];
let current: SpelledNote;
let prevMidi: number | null = null;
let score: Score = emptyScore(loadBest());
let stats: Stats = loadStats();
let awaitingRelease: number | null = null;

function loadBest(): number {
  return Number(localStorage.getItem(BEST_KEY)) || 0;
}

function loadStats(): Stats {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") as Stats;
  } catch {
    return {};
  }
}

function currentScale() {
  return KEY_OPTIONS[settings.keyIndex]!.scale;
}

function renderPending() {
  renderNotes(staffEl, [{ note: current, status: "pending" }]);
}

/** Move to a fresh note, far from the one just finished, biased toward harder notes. */
function advance() {
  current = pickWeightedNote(
    pool,
    prevMidi,
    settings.minInterval,
    (n) => noteWeight(stats[noteToMidi(n)]),
    rng,
  );
  prevMidi = noteToMidi(current);
  renderPending();
}

/** Rebuild the note pool and start on a fresh, unconstrained note. */
function restart() {
  pool = allowedNotes(currentScale(), settings.includeAccidentals, RANGE);
  prevMidi = null;
  awaitingRelease = null;
  advance();
}

function updateScoreUI() {
  streakCurrentEl.textContent = String(score.streak);
  streakBestEl.textContent = `best ${score.best}`;
}

/** How the played pitch should appear on the staff next to the target. */
function playedDisplayNote(playedMidi: number): SpelledNote {
  const preferFlat = keyPrefersFlats(currentScale());
  const midi = settings.ignoreOctave
    ? nearestMidiWithPitchClass(playedMidi, noteToMidi(current))
    : playedMidi;
  return spellMidi(midi, preferFlat);
}

function onPlay(midi: number) {
  if (awaitingRelease !== null) return;
  const correct = matchPitch(noteToMidi(current), midi, { ignoreOctave: settings.ignoreOctave }) === "correct";
  score = updateScore(score, correct);
  if (score.best > loadBest()) localStorage.setItem(BEST_KEY, String(score.best));
  stats = recordResult(stats, noteToMidi(current), correct);
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  updateScoreUI();

  if (correct) {
    renderNotes(staffEl, [{ note: current, status: "correct" }]);
    awaitingRelease = midi;
  } else {
    renderNotes(staffEl, [
      { note: current, status: "pending" },
      { note: playedDisplayNote(midi), status: "wrong" },
    ]);
  }
}

function onRelease(midi: number) {
  if (awaitingRelease === null || midi !== awaitingRelease) return;
  awaitingRelease = null;
  // Keep the green note up a moment after release, even for a quick tap, then move on.
  window.setTimeout(advance, LINGER_MS);
}

// Audio sounds for any played key, independent of the game logic (so you still
// hear a note even while a correct one is lingering and input is ignored).
function handlePlay(midi: number) {
  if (settings.sound) playAudio(midi);
  onPlay(midi);
}

function handleRelease(midi: number) {
  if (settings.sound) stopAudio(midi);
  onRelease(midi);
}

function buildPianoUI() {
  buildPiano(pianoEl, noteToMidi({ step: "C", alter: 0, octave: settings.baseOctave }), PIANO_OCTAVES, handlePlay, handleRelease);
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
    restart();
  });

  const accidentals = $<HTMLInputElement>("accidentals");
  accidentals.checked = settings.includeAccidentals;
  accidentals.addEventListener("change", () => {
    settings.includeAccidentals = accidentals.checked;
    restart();
  });

  const minInterval = $<HTMLInputElement>("minInterval");
  const minIntervalOut = $<HTMLOutputElement>("minIntervalOut");
  minInterval.value = String(settings.minInterval);
  minIntervalOut.textContent = String(settings.minInterval);
  minInterval.addEventListener("input", () => {
    settings.minInterval = Number(minInterval.value);
    minIntervalOut.textContent = minInterval.value;
  });

  const baseOctave = $<HTMLInputElement>("baseOctave");
  baseOctave.value = String(settings.baseOctave);
  baseOctave.addEventListener("change", () => {
    settings.baseOctave = Number(baseOctave.value);
    buildPianoUI();
  });

  const ignoreOctave = $<HTMLInputElement>("ignoreOctave");
  ignoreOctave.checked = settings.ignoreOctave;
  ignoreOctave.addEventListener("change", () => {
    settings.ignoreOctave = ignoreOctave.checked;
  });

  const sound = $<HTMLInputElement>("sound");
  sound.checked = settings.sound;
  sound.addEventListener("change", () => {
    settings.sound = sound.checked;
  });
}

function showMidiStatus(status: MidiStatus) {
  if (status.kind === "unsupported") {
    midiStatusEl.textContent = "MIDI: not supported in this browser (use the keyboard below).";
  } else if (status.kind === "denied") {
    midiStatusEl.textContent = "MIDI: access denied.";
  } else {
    midiStatusEl.textContent = status.devices.length
      ? `MIDI: ${status.devices.join(", ")}`
      : "MIDI: ready (no device connected yet).";
  }
}

bindControls();
buildPianoUI();
listenKeyboard(() => settings.baseOctave, handlePlay, handleRelease);
void listenMidi(handlePlay, handleRelease, showMidiStatus);
updateScoreUI();
restart();
