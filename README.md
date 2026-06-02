# Sheet Reading Trainer

A small web app for drilling note reading on piano staves. A note is shown on a
grand staff; you play it on your computer keyboard, the on-screen piano (tap on
mobile), or a MIDI keyboard. A correct pitch turns green; a wrong one is shown in
red next to the target so you see your mistake. Played notes sound on a sampled
GM grand piano (toggleable).

Notes come endlessly, one at a time, each jumping far from the previous one
(configurable minimum interval), so you must recognise each note on its own
instead of adjusting relative to its neighbour. The range spans E1 to A6 (well
past four ledger lines either side of the grand staff). A streak counter rewards
correct runs; the best streak is kept in `localStorage`.

Per-note success/failure counts are stored, and the next note is drawn from a
distribution biased toward the notes you get wrong most — easy notes still show
up, just less often.

Live: https://jkrumbiegel.com/sheet-reading/

## Run

```sh
npm install
npm run dev      # dev server
npm test         # unit tests (watch: npm run test:watch)
npm run build    # type-check + production build
```

Node is pinned to 24 via `mise.toml`.

MIDI input uses the native Web MIDI API (Chrome/Edge; Safari behind a flag).
Without MIDI, the computer keyboard works: `A S D F G H J K` = `C D E F G A B C`,
with `W E T Y U` for the black keys — or tap the on-screen piano.

## Architecture

Pure domain core (fully unit-tested) + thin IO adapters (the parts that touch the
DOM, MIDI, and VexFlow).

```
src/
  domain/        pure, deterministic, fully test-covered
    note.ts        spelled note <-> MIDI number (C4 = 60), nearest-octave helper
    scale.ts       major-key spelling, allowed-note pool, arbitrary-MIDI spelling
    sequence.ts    pickWeightedNote: next note ≥N semitones away, difficulty-weighted
    match.ts       played vs expected pitch -> correct | wrong (octave-optional)
    score.ts       streak / best-streak update logic
    stats.ts       per-note success/failure tally and difficulty weighting
    rng.ts         seeded PRNG (mulberry32)
  io/            thin adapters, verified by build + manual run
    keyboard.ts    computer-key -> MIDI (the key map itself is unit-tested)
    midi.ts        Web MIDI Note-On / Note-Off subscription
    renderer.ts    VexFlow grand-staff rendering (note far from the clef)
    piano.ts       tappable on-screen piano keyboard
    audio.ts       GM grand-piano playback via smplr (sampled, CDN-loaded)
  keys.ts        the selectable major keys
  main.ts        settings UI + wiring
```

All the logic worth testing lives in `domain/`; the adapters just translate
events in and out of it.

## Deployment

Pushing to `main` runs the tests, builds, and deploys to GitHub Pages via
`.github/workflows/deploy.yml`. The Vite `base` is set to `/sheet-reading/` for
the build so asset paths resolve under the project-pages URL.

## Settings

Base key (default C major), include sharps/flats, minimum jump between notes,
keyboard base octave, and ignore-octave matching (match by pitch class only —
handy for the one-octave computer keyboard and the on-screen piano).

## Status / next steps

- Modes beyond major (the `Scale.mode` type is the seam for this).
- Per-note timing / accuracy stats.
- Optional Web Audio playback of the played pitch.
