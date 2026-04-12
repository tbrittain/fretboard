<script lang="ts">
import posthog from "posthog-js";
import { onDestroy, onMount } from "svelte";
import GuitarNeck from "$lib/components/GuitarNeck.svelte";
import { type StringNote } from "$types/GuitarNeckEStandardTuning";
import { Note, PITCH_CLASS_NAMES } from "$types/Note";

type Phase = "name" | "find";

interface ScaleDegree {
	label: string;
	semitones: number;
}

interface AttemptRecord {
	key: string;
	degreesLabel: string;
	targetNotes: string;
	nameErrors: number;
	findErrors: number;
	timedOut: boolean;
	correct: boolean;
}

const STORAGE_KEY = "interval-key-context-history";
const MAX_HISTORY = 500;
const TIMER_SECONDS = 15;
const FIND_FRETS = 12;

const MAJOR_KEYS = [
	"C",
	"G",
	"D",
	"A",
	"E",
	"B",
	"F#",
	"Db",
	"Ab",
	"Eb",
	"Bb",
	"F",
] as const;
type MajorKey = (typeof MAJOR_KEYS)[number];

const ALL_DEGREES: ScaleDegree[] = [
	{ label: "1", semitones: 0 },
	{ label: "2", semitones: 2 },
	{ label: "♭3", semitones: 3 },
	{ label: "3", semitones: 4 },
	{ label: "4", semitones: 5 },
	{ label: "♭5", semitones: 6 },
	{ label: "5", semitones: 7 },
	{ label: "♭6", semitones: 8 },
	{ label: "6", semitones: 9 },
	{ label: "♭7", semitones: 10 },
	{ label: "7", semitones: 11 },
];

function generateQuestion(): {
	key: MajorKey;
	degrees: ScaleDegree[];
	notes: string[];
} {
	const key = MAJOR_KEYS[Math.floor(Math.random() * MAJOR_KEYS.length)];
	const root = new Note(key);
	const count = 3 + Math.floor(Math.random() * 2); // 3 or 4 degrees
	const nonRoot = ALL_DEGREES.filter((d) => d.semitones !== 0);
	const shuffled = [...nonRoot].sort(() => Math.random() - 0.5);
	const selected = [ALL_DEGREES[0], ...shuffled.slice(0, count - 1)];
	selected.sort((a, b) => a.semitones - b.semitones);
	const notes = selected.map((d) => root.transpose(d.semitones).canonicalName);
	return { key, degrees: selected, notes };
}

// Initialize first question synchronously (SSR is disabled)
const _init = generateQuestion();

// Settings
let timerEnabled = $state(false);

// Current question
let currentKey = $state<MajorKey>(_init.key);
let currentDegrees = $state<ScaleDegree[]>(_init.degrees);
let targetNotes = $state<string[]>(_init.notes);

// Phase
let phase = $state<Phase>("name");

// Phase 1 (name) state
let foundInNamePhase = $state(new Set<string>());
let namePhaseErrors = $state(0);
let wrongFlashNote = $state<string | null>(null);

// Phase 2 (find) state
let foundOnNeck = $state<StringNote[]>([]);
let foundPitchClassesOnNeck = $state(new Set<string>());
let findPhaseErrors = $state(0);

// Global quiz state
let phaseLocked = $state(false);
let feedback = $state<{ text: string; correct: boolean } | null>(null);
let sessionScore = $state({ correct: 0, total: 0 });
let advanceTimeout: ReturnType<typeof setTimeout> | null = null;
let flashTimeout: ReturnType<typeof setTimeout> | null = null;
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

// Timer
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

// Derived labels
let degreesLabel = $derived(currentDegrees.map((d) => d.label).join("–"));

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
	if (flashTimeout) clearTimeout(flashTimeout);
	if (feedbackTimeout) clearTimeout(feedbackTimeout);
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
	if (phaseLocked || phase !== "name") return;
	phaseLocked = true;
	feedback = {
		text: `Time's up! Answer: ${targetNotes.join(", ")}`,
		correct: false,
	};
	sessionScore = { ...sessionScore, total: sessionScore.total + 1 };
	recordAttempt({
		key: currentKey,
		degreesLabel,
		targetNotes: targetNotes.join(" "),
		nameErrors: namePhaseErrors,
		findErrors: 0,
		timedOut: true,
		correct: false,
	});
	scheduleAdvance();
}

function scheduleAdvance() {
	if (advanceTimeout) clearTimeout(advanceTimeout);
	advanceTimeout = setTimeout(advance, 2000);
}

function advance() {
	const q = generateQuestion();
	currentKey = q.key;
	currentDegrees = q.degrees;
	targetNotes = q.notes;
	phase = "name";
	foundInNamePhase = new Set();
	namePhaseErrors = 0;
	wrongFlashNote = null;
	foundOnNeck = [];
	foundPitchClassesOnNeck = new Set();
	findPhaseErrors = 0;
	phaseLocked = false;
	feedback = null;
	if (timerEnabled) startTimer();
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

function onNoteButtonClick(pc: string) {
	if (phaseLocked || phase !== "name" || foundInNamePhase.has(pc)) return;

	if (targetNotes.includes(pc)) {
		const newFound = new Set(foundInNamePhase);
		newFound.add(pc);
		foundInNamePhase = newFound;
		if (newFound.size === targetNotes.length) {
			onNamePhaseComplete();
		}
	} else {
		namePhaseErrors++;
		wrongFlashNote = pc;
		if (flashTimeout) clearTimeout(flashTimeout);
		flashTimeout = setTimeout(() => {
			wrongFlashNote = null;
		}, 500);
	}
}

function onNamePhaseComplete() {
	stopTimer();
	phase = "find";
	feedback = null;
}

function onFretClick(stringNote: StringNote) {
	if (phaseLocked || phase !== "find") return;
	const pc = stringNote.note.canonicalName;

	if (targetNotes.includes(pc)) {
		const alreadyAt = foundOnNeck.some(
			(f) =>
				f.stringIndex === stringNote.stringIndex &&
				f.note.toMidi() === stringNote.note.toMidi(),
		);
		if (!alreadyAt) {
			foundOnNeck = [...foundOnNeck, stringNote];
		}
		if (!foundPitchClassesOnNeck.has(pc)) {
			const newFound = new Set(foundPitchClassesOnNeck);
			newFound.add(pc);
			foundPitchClassesOnNeck = newFound;
			if (newFound.size === targetNotes.length) {
				onFindPhaseComplete();
			}
		}
	} else {
		findPhaseErrors++;
		feedback = { text: "Not a target note", correct: false };
		if (feedbackTimeout) clearTimeout(feedbackTimeout);
		feedbackTimeout = setTimeout(() => {
			if (!phaseLocked) feedback = null;
		}, 800);
	}
}

function onFindPhaseComplete() {
	phaseLocked = true;
	if (feedbackTimeout) clearTimeout(feedbackTimeout);
	const correct = namePhaseErrors === 0 && findPhaseErrors === 0;
	const totalErrors = namePhaseErrors + findPhaseErrors;

	if (correct) {
		feedback = { text: "Perfect! No errors in either phase.", correct: true };
		sessionScore = {
			correct: sessionScore.correct + 1,
			total: sessionScore.total + 1,
		};
	} else {
		feedback = {
			text: `Done — ${totalErrors} error${totalErrors === 1 ? "" : "s"} (${namePhaseErrors} naming, ${findPhaseErrors} finding).`,
			correct: false,
		};
		sessionScore = { ...sessionScore, total: sessionScore.total + 1 };
	}

	recordAttempt({
		key: currentKey,
		degreesLabel,
		targetNotes: targetNotes.join(" "),
		nameErrors: namePhaseErrors,
		findErrors: findPhaseErrors,
		timedOut: false,
		correct,
	});

	posthog.capture("interval_key_context_answered", {
		correct,
		key: currentKey,
		degrees_label: degreesLabel,
		target_notes: targetNotes.join(" "),
		name_errors: namePhaseErrors,
		find_errors: findPhaseErrors,
		score_correct: sessionScore.correct,
		score_total: sessionScore.total,
	});

	scheduleAdvance();
}

function toggleTimer() {
	timerEnabled = !timerEnabled;
	if (timerEnabled) {
		if (!phaseLocked && phase === "name") startTimer();
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
	<title>Fretboard — Key Context Quiz</title>
</svelte:head>

<div class="quiz">
	<h2>Key Context Quiz</h2>
	<p class="subtitle">Name the notes for a key + interval set, then find them on the neck</p>

	<div class="controls">
		<label class="control timer-toggle">
			<input type="checkbox" checked={timerEnabled} onchange={toggleTimer} />
			Timer ({TIMER_SECONDS}s)
		</label>
	</div>

	<div class="phase-stepper">
		<span class="step" class:active={phase === "name"} class:done={phase === "find"}>
			① Name the notes
		</span>
		<span class="step-arrow">→</span>
		<span class="step" class:active={phase === "find"}>
			② Find on neck
		</span>
	</div>

	{#if phase === "name"}
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

		<div class="prompt-card">
			<span class="prompt-text">
				Key of <strong>{currentKey} Major</strong> — what notes are
				<strong>{degreesLabel}</strong>?
			</span>
		</div>

		<p class="progress-label">{foundInNamePhase.size} / {targetNotes.length} notes found</p>

		<div class="note-buttons">
			{#each PITCH_CLASS_NAMES as pc}
				<button
					class:found={foundInNamePhase.has(pc)}
					class:wrong={wrongFlashNote === pc}
					disabled={foundInNamePhase.has(pc) || phaseLocked}
					onclick={() => onNoteButtonClick(pc)}
				>
					{pc}
				</button>
			{/each}
		</div>
	{/if}

	{#if phase === "find"}
		<div class="find-prompt">
			<span class="find-label">Find:</span>
			<div class="target-notes">
				{#each targetNotes as note}
					<span class="target-note" class:found={foundPitchClassesOnNeck.has(note)}>
						{note}
					</span>
				{/each}
			</div>
			<span class="find-count">{foundPitchClassesOnNeck.size} / {targetNotes.length}</span>
		</div>

		<div class="neck-container">
			<GuitarNeck
				selectedNotes={foundOnNeck}
				onNoteClick={onFretClick}
				startsAtFret={0}
				numberOfFrets={FIND_FRETS}
				displayNoteLabels={false}
			/>
		</div>
	{/if}

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
							{item.key} Major, {item.degreesLabel} → {item.targetNotes}
						</span>
						{#if !item.correct}
							<span class="hist-you">
								{item.timedOut
									? "(timeout)"
									: `(${item.nameErrors}+${item.findErrors} err)`}
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
		text-align: center;
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

	/* Phase stepper */
	.phase-stepper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
	}

	.step {
		color: #475569;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		border: 1px solid #334155;
		transition: color 0.2s, border-color 0.2s, background 0.2s;
	}

	.step.active {
		color: #38bdf8;
		border-color: #0891b2;
		background: rgba(8, 145, 178, 0.1);
	}

	.step.done {
		color: #4ade80;
		border-color: #16a34a;
		background: rgba(22, 163, 74, 0.1);
	}

	.step-arrow {
		color: #334155;
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

	/* Name phase */
	.prompt-card {
		padding: 1.25rem 2rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 10px;
		text-align: center;
		max-width: 500px;
	}

	.prompt-text {
		font-size: 1.05rem;
		color: #cbd5e1;
		line-height: 1.6;
	}

	.prompt-text strong {
		color: #f1f5f9;
		font-size: 1.15rem;
	}

	.progress-label {
		margin: 0;
		font-size: 0.85rem;
		color: #64748b;
	}

	.note-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		max-width: 440px;
	}

	.note-buttons button {
		padding: 0.5rem 0.9rem;
		min-width: 52px;
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		transition: background 0.12s, border-color 0.12s, color 0.12s;
	}

	.note-buttons button:hover:not(:disabled) {
		background: #334155;
		border-color: #475569;
	}

	.note-buttons button.found {
		background: #14532d;
		color: #4ade80;
		border-color: #16a34a;
		cursor: default;
	}

	.note-buttons button.wrong {
		background: #450a0a;
		color: #f87171;
		border-color: #991b1b;
	}

	.note-buttons button:disabled:not(.found) {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Find phase */
	.find-prompt {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.find-label {
		color: #64748b;
		font-size: 0.9rem;
	}

	.target-notes {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.target-note {
		padding: 0.3rem 0.8rem;
		border-radius: 5px;
		background: #1e293b;
		border: 1px solid #334155;
		color: #e2e8f0;
		font-weight: 600;
		font-size: 1rem;
		transition: background 0.2s, color 0.2s, border-color 0.2s;
	}

	.target-note.found {
		background: #14532d;
		color: #4ade80;
		border-color: #16a34a;
	}

	.find-count {
		color: #64748b;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}

	.neck-container {
		width: 100%;
		overflow-x: auto;
		display: flex;
		justify-content: center;
	}

	/* Feedback */
	.feedback {
		padding: 0.5rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.95rem;
		text-align: center;
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
		max-width: 520px;
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
