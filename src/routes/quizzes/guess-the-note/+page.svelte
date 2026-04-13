<script lang="ts">
import posthog from "posthog-js";
import { onDestroy, onMount } from "svelte";
import GuitarNeck from "$lib/components/GuitarNeck.svelte";
import {
	GuitarNeckEStandardTuning,
	type StringNote,
} from "$types/GuitarNeckEStandardTuning";
import { PITCH_CLASS_NAMES } from "$types/Note";

interface ActiveNote extends StringNote {
	fretNumber: number;
}

interface AttemptRecord {
	stringIndex: number;
	fretNumber: number;
	note: string;
	answer: string;
	correct: boolean;
}

const STORAGE_KEY = "guess-the-note-history";
const MAX_HISTORY = 500;
const TIMER_SECONDS = 10;

// Settings
let startsAtFret = $state(0);
let numberOfFrets = $state(3);
let timerEnabled = $state(false);

// Quiz state
let feedback = $state<{ text: string; correct: boolean } | null>(null);
let guessLocked = $state(false);
let sessionScore = $state({ correct: 0, total: 0 });
let advanceTimeout: ReturnType<typeof setTimeout> | null = null;

// Timer state
let timerRemaining = $state(TIMER_SECONDS);
let timerInterval: ReturnType<typeof setInterval> | null = null;
let timerPct = $derived(timerRemaining / TIMER_SECONDS);

// History
let allHistory = $state<AttemptRecord[]>([]);
let allTimeScore = $derived({
	correct: allHistory.filter((a) => a.correct).length,
	total: allHistory.length,
});
let recentHistory = $derived(allHistory.slice(0, 20));

function getRandomNote(): ActiveNote {
	const stringIndex = Math.floor(Math.random() * 6);
	const fretNumber = Math.floor(Math.random() * numberOfFrets) + startsAtFret;
	return {
		stringIndex,
		fretNumber,
		note: GuitarNeckEStandardTuning[stringIndex][fretNumber],
	};
}

let currentNote = $state(getRandomNote());

onMount(() => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) allHistory = JSON.parse(raw);
	} catch {
		/* ignore */
	}
});

onDestroy(() => {
	stopTimer();
	if (advanceTimeout) clearTimeout(advanceTimeout);
});

function stopTimer() {
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
}

function startTimer() {
	stopTimer();
	if (!timerEnabled) return;
	timerRemaining = TIMER_SECONDS;
	timerInterval = setInterval(() => {
		timerRemaining = Math.max(0, timerRemaining - 1);
		if (timerRemaining === 0) {
			stopTimer();
			onTimeout();
		}
	}, 1000);
}

function onTimeout() {
	if (guessLocked) return;
	guessLocked = true;
	feedback = {
		text: `Time's up! — ${currentNote.note.toString()}`,
		correct: false,
	};
	sessionScore = { ...sessionScore, total: sessionScore.total + 1 };
	recordAttempt({
		stringIndex: currentNote.stringIndex,
		fretNumber: currentNote.fretNumber,
		note: currentNote.note.canonicalName,
		answer: "—",
		correct: false,
	});
	scheduleAdvance();
}

function scheduleAdvance() {
	if (advanceTimeout) clearTimeout(advanceTimeout);
	advanceTimeout = setTimeout(advance, 2000);
}

function advance() {
	feedback = null;
	guessLocked = false;
	currentNote = getRandomNote();
	startTimer();
}

function recordAttempt(attempt: AttemptRecord) {
	const updated = [attempt, ...allHistory].slice(0, MAX_HISTORY);
	allHistory = updated;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	} catch {
		/* ignore */
	}
}

function guess(pc: string) {
	if (guessLocked) return;
	stopTimer();
	guessLocked = true;

	const correct = currentNote.note.canonicalName === pc;

	if (correct) {
		feedback = {
			text: `Correct! — ${currentNote.note.toString()}`,
			correct: true,
		};
		sessionScore = {
			correct: sessionScore.correct + 1,
			total: sessionScore.total + 1,
		};
	} else {
		feedback = {
			text: `Incorrect — ${currentNote.note.toString()}`,
			correct: false,
		};
		sessionScore = { ...sessionScore, total: sessionScore.total + 1 };
	}

	recordAttempt({
		stringIndex: currentNote.stringIndex,
		fretNumber: currentNote.fretNumber,
		note: currentNote.note.canonicalName,
		answer: pc,
		correct,
	});

	posthog.capture("guess_the_note_answered", {
		correct,
		guessed_note: pc,
		correct_note: currentNote.note.canonicalName,
		string_index: currentNote.stringIndex,
		starts_at_fret: startsAtFret,
		number_of_frets: numberOfFrets,
		score_correct: sessionScore.correct,
		score_total: sessionScore.total,
	});

	scheduleAdvance();
}

function onStartFretChange(e: Event) {
	const newValue = parseInt((e.target as HTMLSelectElement).value, 10);
	posthog.capture("guess_the_note_settings_changed", {
		setting: "starts_at_fret",
		value: newValue,
		number_of_frets: numberOfFrets,
	});
	startsAtFret = newValue;
	if (advanceTimeout) clearTimeout(advanceTimeout);
	advance();
}

function onNumFretsChange(e: Event) {
	const newValue = parseInt((e.target as HTMLSelectElement).value, 10);
	posthog.capture("guess_the_note_settings_changed", {
		setting: "number_of_frets",
		value: newValue,
		starts_at_fret: startsAtFret,
	});
	numberOfFrets = newValue;
	if (advanceTimeout) clearTimeout(advanceTimeout);
	advance();
}

function toggleTimer() {
	timerEnabled = !timerEnabled;
	if (timerEnabled) {
		if (!guessLocked) startTimer();
	} else {
		stopTimer();
	}
}

function clearHistory() {
	allHistory = [];
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* ignore */
	}
}
</script>

<svelte:head>
	<title>Fretboard — Guess the Note</title>
</svelte:head>

<div class="quiz">
	<h2>Guess the Note</h2>

	<div class="controls">
		<label class="control">
			Starting fret
			<select value={startsAtFret} onchange={onStartFretChange}>
				{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</label>

		<label class="control">
			Number of frets
			<select value={numberOfFrets} onchange={onNumFretsChange}>
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as n}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</label>

		<label class="control timer-toggle">
			<input type="checkbox" checked={timerEnabled} onchange={toggleTimer} />
			Timer ({TIMER_SECONDS}s)
		</label>
	</div>

	{#if timerEnabled}
		<div class="timer-wrap">
			<div
				class="timer-bar"
				class:warning={timerPct < 0.4 && timerPct >= 0.2}
				class:danger={timerPct < 0.2}
				style:width="{timerPct * 100}%"
			></div>
			<span class="timer-label">{timerRemaining}s</span>
		</div>
	{/if}

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

	<div class="scores">
		<span class="score-item">
			<span class="score-label">Session</span>
			<span class="score-value">{sessionScore.correct} / {sessionScore.total}</span>
		</span>
		{#if allTimeScore.total > 0}
			<span class="score-sep">|</span>
			<span class="score-item">
				<span class="score-label">All-time</span>
				<span class="score-value">{allTimeScore.correct} / {allTimeScore.total}</span>
			</span>
		{/if}
	</div>

	{#if recentHistory.length > 0}
		<div class="history">
			<div class="history-header">
				<h3>Recent Attempts</h3>
				<button class="clear-btn" onclick={clearHistory}>Clear history</button>
			</div>
			<ul>
				{#each recentHistory as item}
					<li class:hist-correct={item.correct} class:hist-incorrect={!item.correct}>
						<span class="hist-icon">{item.correct ? "✓" : "✗"}</span>
						<span class="hist-eq">
							String {item.stringIndex + 1}, Fret {item.fretNumber} &rarr; {item.note}
						</span>
						{#if !item.correct}
							<span class="hist-you">
								{item.answer === "—" ? "(timeout)" : `(you: ${item.answer})`}
							</span>
						{/if}
					</li>
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
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #94a3b8;
	}

	.timer-toggle {
		cursor: pointer;
		user-select: none;
	}

	.timer-toggle input[type="checkbox"] {
		cursor: pointer;
		accent-color: #0891b2;
	}

	select {
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #475569;
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		font-family: inherit;
	}

	/* Timer bar */
	.timer-wrap {
		width: 100%;
		max-width: 400px;
		position: relative;
		height: 6px;
		background: #1e293b;
		border-radius: 3px;
		overflow: hidden;
		display: flex;
		align-items: center;
	}

	.timer-bar {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		background: #0891b2;
		border-radius: 3px;
		transition: width 0.9s linear, background 0.3s;
	}

	.timer-bar.warning {
		background: #f59e0b;
	}

	.timer-bar.danger {
		background: #ef4444;
	}

	.timer-label {
		position: absolute;
		right: 0;
		top: -1.4rem;
		font-size: 0.75rem;
		color: #64748b;
		font-variant-numeric: tabular-nums;
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

	/* Scores */
	.scores {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.9rem;
		color: #64748b;
	}

	.score-item {
		display: flex;
		gap: 0.4rem;
		align-items: baseline;
	}

	.score-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.score-value {
		font-weight: 600;
		color: #94a3b8;
		font-variant-numeric: tabular-nums;
	}

	.score-sep {
		color: #334155;
	}

	/* History */
	.history {
		width: 100%;
		max-width: 420px;
	}

	.history-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.history-header h3 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 500;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.clear-btn {
		background: none;
		border: 1px solid #334155;
		color: #64748b;
		font-size: 0.75rem;
		font-family: inherit;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.clear-btn:hover {
		border-color: #475569;
		color: #94a3b8;
	}

	.history ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.history li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.hist-correct {
		color: #4ade80;
		background: #052e1640;
	}

	.hist-incorrect {
		color: #f87171;
		background: #2d0a0a40;
	}

	.hist-icon {
		font-size: 0.75rem;
		width: 1em;
		flex-shrink: 0;
	}

	.hist-eq {
		flex: 1;
		font-variant-numeric: tabular-nums;
	}

	.hist-you {
		font-size: 0.8rem;
		opacity: 0.7;
	}
</style>
