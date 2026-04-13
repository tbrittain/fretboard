<script lang="ts">
import posthog from "posthog-js";
import { onDestroy, onMount } from "svelte";
import { flatNameForSemitone, Note, PITCH_CLASS_NAMES } from "$types/Note";

interface AttemptRecord {
	note: string;
	offset: number;
	target: string;
	answer: string;
	correct: boolean;
}

const STORAGE_KEY = "note-math-history";
const MAX_HISTORY = 500;
const TIMER_SECONDS = 10;

// Settings
let maxSemitones = $state(5);
let timerEnabled = $state(false);

// Quiz state
let inputValue = $state("");
let feedback = $state<{ text: string; correct: boolean } | null>(null);
let answered = $state(false);
let sessionScore = $state({ correct: 0, total: 0 });
let currentNote = $state(getRandomNote());
let semitones = $state(getRandomOffset(5));
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

function getRandomNote(): Note {
	const pc =
		PITCH_CLASS_NAMES[Math.floor(Math.random() * PITCH_CLASS_NAMES.length)];
	return new Note(pc);
}

function getRandomOffset(max: number): number {
	const range = max * 2;
	let offset = Math.floor(Math.random() * range) - max;
	if (offset >= 0) offset += 1;
	return offset;
}

// Use flat names when the offset is negative (going down), sharps when going up
function targetDisplayName(note: Note, offset: number): string {
	const target = note.transpose(offset);
	return offset < 0
		? flatNameForSemitone(target.toMidi())
		: target.canonicalName;
}

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
	if (answered) return;
	answered = true;
	const tName = targetDisplayName(currentNote, semitones);
	feedback = { text: `Time's up! Answer: ${tName}`, correct: false };
	sessionScore = { ...sessionScore, total: sessionScore.total + 1 };
	recordAttempt({
		note: currentNote.canonicalName,
		offset: semitones,
		target: tName,
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
	inputValue = "";
	feedback = null;
	answered = false;
	currentNote = getRandomNote();
	semitones = getRandomOffset(maxSemitones);
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

function submit(e?: SubmitEvent) {
	e?.preventDefault();
	if (answered) return;

	const trimmed = inputValue.trim();
	if (!trimmed) {
		feedback = { text: "Enter a pitch-class (e.g. C, F#, Bb)", correct: false };
		return;
	}

	let parsed: Note;
	try {
		parsed = new Note(trimmed);
	} catch {
		feedback = { text: "Invalid — try C, F#, or Bb", correct: false };
		return;
	}

	stopTimer();
	answered = true;

	const target = currentNote.transpose(semitones);
	const correct = parsed.equalsPitchClass(target);
	const tName = targetDisplayName(currentNote, semitones);
	const userAnswer =
		trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

	if (correct) {
		feedback = { text: `Correct! ${tName}`, correct: true };
		sessionScore = {
			correct: sessionScore.correct + 1,
			total: sessionScore.total + 1,
		};
	} else {
		feedback = { text: `Incorrect — answer: ${tName}`, correct: false };
		sessionScore = { ...sessionScore, total: sessionScore.total + 1 };
	}

	recordAttempt({
		note: currentNote.canonicalName,
		offset: semitones,
		target: tName,
		answer: userAnswer,
		correct,
	});

	posthog.capture("note_math_answered", {
		correct,
		root_note: currentNote.canonicalName,
		semitone_offset: semitones,
		correct_answer: tName,
		submitted_answer: trimmed,
		max_semitones: maxSemitones,
		score_correct: sessionScore.correct,
		score_total: sessionScore.total,
	});

	scheduleAdvance();
}

function onMaxSemitonesChange(e: Event) {
	const newValue = parseInt((e.target as HTMLSelectElement).value, 10);
	posthog.capture("note_math_settings_changed", {
		setting: "max_semitones",
		value: newValue,
	});
	maxSemitones = newValue;
	if (advanceTimeout) clearTimeout(advanceTimeout);
	advance();
}

function toggleTimer() {
	timerEnabled = !timerEnabled;
	if (timerEnabled) {
		if (!answered) startTimer();
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

function offsetLabel(n: number): string {
	return n > 0 ? `+${n}` : String(n);
}
</script>

<svelte:head>
	<title>Fretboard — Note Math</title>
</svelte:head>

<div class="quiz">
	<h2>Note Math</h2>
	<p class="subtitle">Name the pitch class after applying the semitone offset</p>

	<div class="controls">
		<label class="control">
			Max semitones
			<select value={maxSemitones} onchange={onMaxSemitonesChange}>
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as n}
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

	<div class="problem">
		<span class="note-name">{currentNote.canonicalName}</span>
		<span class="offset">{offsetLabel(semitones)}</span>
		<span class="equals">=</span>
		<form onsubmit={submit}>
			<input
				bind:value={inputValue}
				maxlength={2}
				aria-label="Answer"
				placeholder="?"
				autocomplete="off"
				spellcheck="false"
			/>
			<button type="submit">Submit</button>
		</form>
	</div>

	{#if feedback}
		<div
			class="feedback"
			class:correct={feedback.correct}
			class:incorrect={!feedback.correct}
		>
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
							{item.note}
							{offsetLabel(item.offset)}
							&rarr;
							{item.target}
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

	.subtitle {
		margin: 0;
		color: #64748b;
		font-size: 0.875rem;
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

	.problem {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 2rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 10px;
	}

	.note-name {
		font-size: 2.5rem;
		font-weight: 700;
		color: #f1f5f9;
		min-width: 2.5ch;
		text-align: center;
	}

	.offset {
		font-size: 1.75rem;
		font-weight: 500;
		color: #38bdf8;
		min-width: 3ch;
		text-align: center;
	}

	.equals {
		font-size: 1.75rem;
		color: #334155;
	}

	form {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	input {
		width: 3.5ch;
		padding: 0.5rem 0.4rem;
		font-size: 1.25rem;
		text-align: center;
		background: #0f172a;
		color: #f1f5f9;
		border: 1px solid #475569;
		border-radius: 6px;
		font-family: inherit;
	}

	input:focus {
		outline: none;
		border-color: #38bdf8;
	}

	form button {
		padding: 0.5rem 1rem;
		background: #0891b2;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.9rem;
	}

	form button:hover {
		background: #0e7490;
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
