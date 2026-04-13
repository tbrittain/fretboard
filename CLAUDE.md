# Fretboard — Claude Guide

## What this is

A client-side guitar learning app built with SvelteKit + svelte-konva. All guitar neck visuals are rendered on a Konva canvas. There is no backend — this is a pure SPA deployed to Cloudflare Pages.

## Hard constraints

- **No SSR.** `src/routes/+layout.ts` exports `ssr = false`. Do not add server routes (`+server.ts`) or re-enable SSR.
- **No Tailwind.** All styles live in scoped `<style>` blocks inside `.svelte` files.
- **Canvas for fretboards.** Any guitar neck or fretboard visualization must use `svelte-konva` / Konva.js, not DOM elements.

## Tech stack

| Concern | Tool |
|---|---|
| Framework | SvelteKit 2, Svelte 5 |
| Canvas | svelte-konva + konva |
| Adapter | `@sveltejs/adapter-cloudflare` v7+ |
| Unit tests | Vitest (node env, no DOM) |
| Component stories | Storybook (`npm run storybook`) |
| Visual regression | Chromatic (runs on CI against Storybook stories) |
| Linting/Formatting | Biome (replaces ESLint + Prettier; covers `.ts` and `.svelte` files) |
| Deploy | `wrangler pages deploy .svelte-kit/cloudflare` |

## Svelte 5 patterns

Use runes throughout. No `$:` reactive declarations, no `export let`.

```svelte
<script lang="ts">
  // Props
  let { value = 'default', onChange }: { value?: string; onChange?: (v: string) => void } = $props();

  // State
  let count = $state(0);

  // Derived
  let doubled = $derived(count * 2);

  // Derived with logic
  let result = $derived.by(() => {
    try { return { value: compute(count), error: null }; }
    catch (e) { return { value: null, error: String(e) }; }
  });
</script>
```

Use `onclick`, `onchange`, `onsubmit` (not `on:click`) for DOM element events.
Use `on:click` for svelte-konva component events (it uses Svelte 4's event dispatcher internally).

## svelte-konva API

```svelte
<script>
  import { Stage, Layer, Rect, Line, Circle, Text, Group } from 'svelte-konva';
</script>

<Stage width={500} height={200}>
  <Layer>
    <Group x={100} y={50} onclick={handleClick}>
      <Circle radius={12} fill="#2563EB" stroke="white" strokeWidth={1.5} />
      <Text x={-12} y={-12} width={24} height={24} text="C#" align="center" verticalAlign="middle" fill="white" fontSize={10} />
    </Group>
  </Layer>
</Stage>
```

svelte-konva v1 uses **flat props** — all Konva config properties are passed directly as component attributes, not wrapped in a `config` object. Events are plain props too: `onclick`, `onmousedown`, etc. (no `on:` prefix).

For click hit areas on transparent shapes, use `fill="rgba(0,0,0,0.001)"` rather than `"transparent"` to ensure Konva registers the hit.

## Path aliases

| Alias | Points to |
|---|---|
| `$lib` | `src/lib/` |
| `$types` | `src/types/` |

Import musical primitives as: `import { Note } from '$types/Note'`
Import components as: `import GuitarNeck from '$lib/components/GuitarNeck.svelte'`

## Musical primitives (`src/types/`)

These are pure TypeScript — no framework dependencies.

- **`Note`** — pitch class + octave, MIDI conversion, transposition, enharmonic comparison. Key props: `canonicalName` (e.g. `'C#'`), `toString()` (e.g. `'C#4'`).
- **`Chord`** — up to 6 notes, quality detection, voicings, inversions.
- **`GuitarNeckEStandardTuning`** — `Note[6][23]` lookup table, plus `getEStandardFretNotes(fretNumber)` returning `StringNote[]`.

The test files in `src/types/__tests__/` use relative imports and run in Node — keep them that way.

## Adding a new page

1. Create `src/routes/<path>/+page.svelte`
2. Add the link to the `navLinks` array in `src/routes/+layout.svelte`
3. No `+page.ts` needed unless you have page-level state setup; never add `+page.server.ts`

## Component guidelines

### Every new component needs a Storybook story

All new components in `src/lib/components/` must have a corresponding `.stories.ts` file. Stories serve as the primary visual contract for a component — they document its props, show its states, and are the mechanism by which Chromatic catches visual regressions in CI.

A story file should cover:
- The default/empty state
- Representative prop combinations (especially boundary values)
- Any visually distinct states (e.g. selected vs unselected, error state)

Chromatic runs against these stories automatically on each push. Visual changes require manual review and acceptance before a PR can merge. **This is intentional** — it keeps visual regressions from sneaking through unnoticed.

### Non-trivial components belong in `src/lib/components/`, not inline in pages

If a component has meaningful internal state, canvas layout logic, or more than a handful of props, it should be a standalone `.svelte` file in `src/lib/components/` — not defined inline within a route's `+page.svelte`. This keeps pages thin (routing + composition only) and makes the component independently testable via Storybook.

A rough heuristic: if you find yourself reaching for `$state` or `$derived` while writing markup inside `+page.svelte`, that logic probably belongs in a named component.

### Extract non-trivial logic to pure TypeScript

There are no component-level unit tests in this project, by design. Svelte components are tested visually through Storybook and Chromatic.

Pure TypeScript — anything that does not depend on Svelte reactivity or the DOM — should live in `src/types/` or `src/lib/` as plain `.ts` files and be covered by Vitest unit tests. This includes:

- Musical computations (interval math, chord quality detection, voicing logic)
- Data transformation (mapping fret numbers to note arrays, filtering, sorting)
- Any conditional logic complex enough to have edge cases worth specifying

If you find yourself writing non-trivial logic inside a `$derived` or a component function, ask whether it can be pulled into a pure function and tested in isolation. The goal is to keep components as thin wrappers over well-tested logic.

## GuitarNeck component

`src/lib/components/GuitarNeck.svelte` accepts:

| Prop | Type | Default | Description |
|---|---|---|---|
| `selectedNotes` | `StringNote[]` | `[]` | Notes to highlight on the neck |
| `onNoteClick` | `(note: StringNote) => void` | — | Called when a fret cell is clicked |
| `startsAtFret` | `number` | `0` | First fret displayed |
| `numberOfFrets` | `number` | `12` | How many frets to show |
| `displayNoteLabels` | `boolean` | `true` | Show pitch class inside selected note circles |

Canvas layout constants are defined at the top of the component script. The neck width is derived from `numberOfFrets`; the height is fixed.

## Linting

Biome is configured as the linter and formatter. The pre-commit hook (via lefthook) runs `biome check --write` on staged files automatically — as long as `node_modules` are installed.

To run manually:

```sh
node_modules/.bin/biome check --write .
```

## Environment setup

Run `.devcontainer/setup.sh` to scaffold a fresh environment. It handles all of the following in order:

1. `npm install` — installs dependencies
2. `cp .env.example .env` — creates a local `.env` with dummy PostHog values so builds don't fail (skipped if `.env` already exists)
3. `npx svelte-kit sync` — generates `.svelte-kit/tsconfig.json` and other SvelteKit type artifacts that `tsconfig.json` extends

**Always run `setup.sh` (or its steps manually) before building, type-checking, or running tests.** Without step 2, the build fails because `$env/static/public` requires `PUBLIC_POSTHOG_HOST` and `PUBLIC_POSTHOG_PROJECT_TOKEN` to be present at build time. Without step 3, TypeScript and Vitest fail with `Tsconfig not found` errors.

The dummy values in `.env.example` (and the copied `.env`) are safe — analytics simply won't fire. Replace them with real PostHog credentials if you need analytics to work locally.
