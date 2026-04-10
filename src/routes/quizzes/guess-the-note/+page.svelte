<script lang="ts">
import posthog from "posthog-js";
import GuitarNeck from "$lib/components/GuitarNeck.svelte";
import {
	GuitarNeckEStandardTuning,
	type StringNote,
} from "$types/GuitarNeckEStandardTuning";
import { PITCH_CLASS_NAMES } from "$types/Note";

let startsAtFret = $state(0);
let numberOfFrets = $state(3);
let score = $state({ correct: 0, total: 0 });
let incorrectNotes = $state<StringNote[]>([]);
let feedback = $state<{ text: string; correct: boolean } | null>(null);
let guessLocked = $state(false);

function getRandomNote(): StringNote {
	const stringIndex = Math.floor(Math.random() * 6);
	const fretNumber = Math.floor(Math.random() * numberOfFrets) + startsAtFret;
	return {
		stringIndex,
		note: GuitarNeckEStandardTuning[stringIndex][fretNumber],
	};
}

let currentNote = $state(getRandomNote());

function guess(pc: string) {
	if (guessLocked) return;
	guessLocked = true;

	const correct = currentNote.note.canonicalName === pc;

	if (correct) {
		feedback = {
			text: `Correct! — ${currentNote.note.toString()}`,
			correct: true,
		};
		score = { correct: score.correct + 1, total: score.total + 1 };
	} else {
		feedback = {
			text: `Incorrect — ${currentNote.note.toString()}`,
			correct: false,
		};
		score = { ...score, total: score.total + 1 };
		incorrectNotes = [...incorrectNotes, currentNote];
	}

	posthog.capture("guess_the_note_answered", {
		correct,
		guessed_note: pc,
		correct_note: currentNote.note.canonicalName,
		string_index: currentNote.stringIndex,
		starts_at_fret: startsAtFret,
		number_of_frets: numberOfFrets,
		score_correct: score.correct,
		score_total: score.total,
	});

	setTimeout(() => {
		currentNote = getRandomNote();
		feedback = null;
		guessLocked = false;
	}, 1200);
}

function onStartFretChange(e: Event) {
	const newValue = parseInt((e.target as HTMLSelectElement).value, 10);
	posthog.capture("guess_the_note_settings_changed", {
		setting: "starts_at_fret",
		value: newValue,
		number_of_frets: numberOfFrets,
	});
	startsAtFret = newValue;
	currentNote = getRandomNote();
}

function onNumFretsChange(e: Event) {
	const newValue = parseInt((e.target as HTMLSelectElement).value, 10);
	posthog.capture("guess_the_note_settings_changed", {
		setting: "number_of_frets",
		value: newValue,
		starts_at_fret: startsAtFret,
	});
	numberOfFrets = newValue;
	currentNote = getRandomNote();
}
</script>

<svelte:head>
	<title>Fretboard — Guess the Note</title>
</svelte:head>

<div class="quiz">
	<h2>Guess the Note</h2>

	<div class="controls">
		<label>
			Starting fret
			<select value={startsAtFret} onchange={onStartFretChange}>
				{#each [0, 1, 2, 3] as n}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</label>

		<label>
			Number of frets
			<select value={numberOfFrets} onchange={onNumFretsChange}>
				{#each [1, 2, 3, 4, 5, 6] as n}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="neck-container">
		<GuitarNeck
			selectedNotes={[currentNote]}
			{startsAtFret}
			{numberOfFrets}
			displayNoteLabels={false}
		/>
	</div>

	<div class="pitch-buttons">
		{#each PITCH_CLASS_NAMES as pc}
			<button onclick={() => guess(pc)} disabled={guessLocked}>{pc}</button>
		{/each}
	</div>

	{#if feedback}
		<div class="feedback" class:correct={feedback.correct} class:incorrect={!feedback.correct}>
			{feedback.text}
		</div>
	{:else}
		<div class="feedback-placeholder"></div>
	{/if}

	<div class="score">Score: {score.correct} / {score.total}</div>

	{#if incorrectNotes.length > 0}
		<div class="incorrects">
			<h3>Incorrect Notes</h3>
			<ul>
				{#each incorrectNotes as n}
					<li>String {n.stringIndex + 1}: {n.note.toString()}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.quiz {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	.controls {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #94a3b8;
	}

	select {
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #475569;
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		font-family: inherit;
	}

	.neck-container {
		width: 100%;
		overflow-x: auto;
		display: flex;
		justify-content: center;
	}

	.pitch-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		max-width: 440px;
	}

	.pitch-buttons button {
		padding: 0.5rem 0.9rem;
		min-width: 52px;
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		transition:
			background 0.12s,
			border-color 0.12s;
	}

	.pitch-buttons button:hover:not(:disabled) {
		background: #334155;
		border-color: #475569;
	}

	.pitch-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.feedback {
		padding: 0.5rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.95rem;
	}

	.feedback-placeholder {
		height: 2rem;
	}

	.correct {
		background: #052e16;
		color: #4ade80;
		border: 1px solid #16a34a;
	}

	.incorrect {
		background: #2d0a0a;
		color: #f87171;
		border: 1px solid #991b1b;
	}

	.score {
		font-size: 1rem;
		color: #64748b;
	}

	.incorrects {
		width: 100%;
		max-width: 400px;
	}

	.incorrects h3 {
		margin: 0 0 0.4rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.incorrects ul {
		list-style: disc;
		padding-left: 1.25rem;
		margin: 0;
		font-size: 0.875rem;
		color: #475569;
	}

	.incorrects li {
		margin: 0.2rem 0;
	}
</style>
