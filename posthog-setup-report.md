# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Fretboard. PostHog is initialized via `src/hooks.client.ts` (which runs once on app load) with a reverse proxy through `/ingest` to avoid ad blockers. Client-side error tracking is wired up via `handleError`. The `svelte.config.js` was updated with `paths.relative: false` for session replay compatibility. Seven events are instrumented across the three main features: the Guess the Note quiz, the Note Math quiz, and the Chord Inspector.

| Event | Description | File |
|---|---|---|
| `guess_the_note_answered` | User selects a pitch class guess — includes correct/incorrect, the guessed and correct notes, current score, and difficulty settings | `src/routes/quizzes/guess-the-note/+page.svelte` |
| `guess_the_note_settings_changed` | User changes the starting fret or number of frets, indicating difficulty preference | `src/routes/quizzes/guess-the-note/+page.svelte` |
| `note_math_answered` | User submits an answer — includes correct/incorrect, root note, semitone offset, correct answer, submitted answer, and current score | `src/routes/quizzes/note-math/+page.svelte` |
| `note_math_settings_changed` | User changes the max semitones difficulty setting | `src/routes/quizzes/note-math/+page.svelte` |
| `chord_inspector_note_added` | User adds a note row to the Chord Inspector | `src/lib/components/ChordInspector.svelte` |
| `chord_inspector_note_removed` | User removes a note row from the Chord Inspector | `src/lib/components/ChordInspector.svelte` |
| `chord_inspected` | A valid chord symbol is identified (fires when the chord symbol changes to a new non-null value) — includes symbol, quality, note count, and notes | `src/lib/components/ChordInspector.svelte` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/376014/dashboard/1454323
- **Guess the Note — Correct vs Incorrect**: https://us.posthog.com/project/376014/insights/EEvwcBeH
- **Note Math — Correct vs Incorrect**: https://us.posthog.com/project/376014/insights/9dk5peHN
- **Chord Inspector — Activity**: https://us.posthog.com/project/376014/insights/a1685Y96
- **Quiz Engagement — Answers by Feature**: https://us.posthog.com/project/376014/insights/U9aF3ud1
- **Guess the Note — Difficulty Settings**: https://us.posthog.com/project/376014/insights/CsFT2aMf

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-sveltekit/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
