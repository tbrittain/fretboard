<script lang="ts">
	import { Note, PITCH_CLASS_NAMES } from '$types/Note';

	let maxSemitones = $state(5);
	let inputValue = $state('');
	let feedback = $state<{ text: string; correct: boolean } | null>(null);
	let score = $state({ correct: 0, total: 0 });
	let incorrects = $state<{ note: Note; offset: number; target: Note }[]>([]);
	let advanceTimeout: ReturnType<typeof setTimeout> | null = null;

	function getRandomNote(): Note {
		const pc = PITCH_CLASS_NAMES[Math.floor(Math.random() * PITCH_CLASS_NAMES.length)];
		return new Note(pc);
	}

	function getRandomOffset(max: number): number {
		const range = max * 2;
		let offset = Math.floor(Math.random() * range) - max;
		if (offset >= 0) offset += 1;
		return offset;
	}

	let currentNote = $state(getRandomNote());
	let semitones = $state(getRandomOffset(5)); // initial value matches default maxSemitones

	function advance() {
		inputValue = '';
		feedback = null;
		currentNote = getRandomNote();
		semitones = getRandomOffset(maxSemitones);
	}

	function submit(e?: SubmitEvent) {
		e?.preventDefault();
		const trimmed = inputValue.trim();
		if (!trimmed) {
			feedback = { text: 'Enter a pitch-class (e.g. C, F#, Bb)', correct: false };
			return;
		}

		let parsed: Note;
		try {
			parsed = new Note(trimmed);
		} catch {
			feedback = { text: 'Invalid — try C, F#, or Bb', correct: false };
			return;
		}

		const target = currentNote.transpose(semitones);
		const correct = parsed.equalsPitchClass(target);
		const targetName = target.toString().replace(/\d+$/, '');

		if (correct) {
			feedback = { text: `Correct! ${targetName}`, correct: true };
			score = { correct: score.correct + 1, total: score.total + 1 };
		} else {
			feedback = { text: `Incorrect — answer: ${targetName}`, correct: false };
			score = { ...score, total: score.total + 1 };
			incorrects = [...incorrects, { note: currentNote, offset: semitones, target }];
		}

		if (advanceTimeout) clearTimeout(advanceTimeout);
		advanceTimeout = setTimeout(advance, 2000);
	}

	function onMaxSemitonesChange(e: Event) {
		maxSemitones = parseInt((e.target as HTMLSelectElement).value, 10);
		if (advanceTimeout) clearTimeout(advanceTimeout);
		advance();
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

	<label class="control">
		Max semitones
		<select value={maxSemitones} onchange={onMaxSemitonesChange}>
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as n}
				<option value={n}>{n}</option>
			{/each}
		</select>
	</label>

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
		<div class="feedback" class:correct={feedback.correct} class:incorrect={!feedback.correct}>
			{feedback.text}
		</div>
	{:else}
		<div class="feedback-placeholder"></div>
	{/if}

	<div class="score">Score: {score.correct} / {score.total}</div>

	{#if incorrects.length > 0}
		<div class="incorrects">
			<h3>Incorrect Attempts</h3>
			<ul>
				{#each incorrects as item}
					<li>
						{item.note.canonicalName}
						{offsetLabel(item.offset)}
						&rarr; {item.target.toString().replace(/\d+$/, '')}
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

	.control {
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
