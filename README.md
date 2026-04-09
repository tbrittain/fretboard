# Fretboard

A client-side app for learning the guitar neck — notes, intervals, and practical exercises.

## Stack

- **[SvelteKit](https://kit.svelte.dev/)** — routing and app framework (CSR-only, no SSR)
- **[Svelte 5](https://svelte.dev/)** — components using runes (`$state`, `$derived`, `$props`)
- **[svelte-konva](https://github.com/konvajs/svelte-konva) + [Konva.js](https://konvajs.org/)** — canvas-based guitar neck rendering
- **[Cloudflare Pages](https://pages.cloudflare.com/)** — deployment via `@sveltejs/adapter-cloudflare`
- **[Vitest](https://vitest.dev/)** — unit tests for musical primitive classes

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview production build locally
npm test           # run unit tests
```

## Deploying

```bash
npm run deploy     # builds and deploys to Cloudflare Pages
```

Requires `wrangler` to be authenticated (`wrangler login`).

## Project Structure

```
src/
  app.html                          # HTML shell
  routes/
    +layout.ts                      # SSR disabled globally
    +layout.svelte                  # Navigation sidebar shell
    +page.svelte                    # Home — Chord Inspector
    quizzes/
      guess-the-note/+page.svelte   # Fretboard note identification quiz
      note-math/+page.svelte        # Semitone transposition quiz
  lib/
    components/
      GuitarNeck.svelte             # Konva canvas fretboard component
      ChordInspector.svelte         # Interactive chord builder
  types/
    Note.ts                         # Note class (pitch, octave, MIDI, transposition)
    Chord.ts                        # Chord class (quality, voicings, inversions)
    GuitarNeckEStandardTuning.ts    # String/fret note lookup table
    __tests__/                      # Vitest unit tests
```

## Features

| Route | Description |
|---|---|
| `/` | **Chord Inspector** — build a chord from pitch classes and octaves, see symbol, quality, and MIDI output |
| `/quizzes/guess-the-note` | **Guess the Note** — a random note is shown on the fretboard without a label; identify its pitch class. Configurable fret range. |
| `/quizzes/note-math` | **Note Math** — given a starting note and a semitone offset, type the resulting pitch class. Configurable max interval. |
