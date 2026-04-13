# Fretboard

A client-side app for learning the guitar neck — notes, intervals, and practical exercises.

## Stack

- **[SvelteKit](https://kit.svelte.dev/)** — routing and app framework (CSR-only, no SSR)
- **[Svelte 5](https://svelte.dev/)** — components using runes (`$state`, `$derived`, `$props`)
- **[svelte-konva](https://github.com/konvajs/svelte-konva) + [Konva.js](https://konvajs.org/)** — canvas-based guitar neck rendering
- **[Cloudflare Pages](https://pages.cloudflare.com/)** — deployment via `@sveltejs/adapter-cloudflare`
- **[Vitest](https://vitest.dev/)** — unit tests for pure TypeScript musical primitives
- **[Storybook](https://storybook.js.org/) + [Chromatic](https://www.chromatic.com/)** — component development and visual regression testing

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview production build locally
npm test           # run unit tests
npm run storybook  # component development server at http://localhost:6006
```

## Deploying

```bash
npm run deploy     # builds and deploys to Cloudflare Pages
```

Requires `wrangler` to be authenticated (`wrangler login`).

