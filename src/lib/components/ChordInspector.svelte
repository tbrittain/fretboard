<script lang="ts">
	import { Chord } from '$types/Chord';
	import { PITCH_CLASS_NAMES, type PitchClass } from '$types/Note';

	const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7];

	type Row = { pc: PitchClass; octave: number };

	let rows = $state<Row[]>([
		{ pc: 'C', octave: 4 },
		{ pc: 'E', octave: 4 },
		{ pc: 'G', octave: 4 },
	]);

	let result = $derived.by(() => {
		try {
			const inputs = rows.map((r) => `${r.pc}${r.octave}`);
			return { chord: new Chord(inputs), error: null };
		} catch (err: unknown) {
			return { chord: null, error: err instanceof Error ? err.message : String(err) };
		}
	});

	function addRow() {
		if (rows.length >= 6) return;
		rows = [...rows, { pc: 'C', octave: 4 }];
	}

	function removeRow(index: number) {
		rows = rows.filter((_, i) => i !== index);
	}

	function updatePc(index: number, value: string) {
		rows = rows.map((r, i) => (i === index ? { ...r, pc: value as PitchClass } : r));
	}

	function updateOctave(index: number, value: string) {
		rows = rows.map((r, i) => (i === index ? { ...r, octave: Number(value) } : r));
	}
</script>

<div class="inspector">
	<h2>Chord Inspector</h2>

	<div class="rows">
		{#each rows as row, idx}
			<div class="row">
				<select
					aria-label="pitch-class-{idx}"
					value={row.pc}
					onchange={(e) => updatePc(idx, (e.target as HTMLSelectElement).value)}
				>
					{#each PITCH_CLASS_NAMES as pc}
						<option value={pc}>{pc}</option>
					{/each}
				</select>

				<select
					aria-label="octave-{idx}"
					value={row.octave}
					onchange={(e) => updateOctave(idx, (e.target as HTMLSelectElement).value)}
				>
					{#each OCTAVES as o}
						<option value={o}>{o}</option>
					{/each}
				</select>

				<button class="remove-btn" onclick={() => removeRow(idx)} aria-label="remove-{idx}">
					Remove
				</button>
			</div>
		{/each}
	</div>

	<div class="actions">
		<button class="add-btn" onclick={addRow} disabled={rows.length >= 6}>Add Note</button>
	</div>

	<div class="result">
		<h3>Result</h3>
		{#if result.error}
			<p class="error">Error: {result.error}</p>
		{:else if result.chord}
			<p><strong>Symbol:</strong> {result.chord.symbol() ?? '—'}</p>
			<p><strong>Quality:</strong> {JSON.stringify(result.chord.quality())}</p>
			<p><strong>Notes:</strong> {result.chord.toString()}</p>
			<p><strong>MIDI:</strong> {result.chord.toMidi().join(', ')}</p>
		{:else}
			<p class="muted">No chord</p>
		{/if}
	</div>
</div>

<style>
	.inspector {
		padding: 1.5rem;
		background: #1e293b;
		border-radius: 8px;
		max-width: 480px;
		border: 1px solid #334155;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.15rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	select {
		background: #0f172a;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		font-size: 0.9rem;
		font-family: inherit;
	}

	select:focus {
		outline: none;
		border-color: #0891b2;
	}

	.remove-btn {
		margin-left: auto;
		background: transparent;
		color: #f87171;
		border: 1px solid #7f1d1d;
		border-radius: 4px;
		padding: 0.25rem 0.6rem;
		cursor: pointer;
		font-size: 0.8rem;
		font-family: inherit;
	}

	.remove-btn:hover {
		background: #2d0a0a;
	}

	.actions {
		margin-bottom: 1rem;
	}

	.add-btn {
		background: #0891b2;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.35rem 0.9rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
	}

	.add-btn:hover {
		background: #0e7490;
	}

	.add-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.result {
		padding: 0.75rem 1rem;
		background: #0f172a;
		border-radius: 6px;
		border: 1px solid #1e293b;
	}

	.result p {
		margin: 0.3rem 0;
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.result p strong {
		color: #cbd5e1;
	}

	.error {
		color: #f87171 !important;
	}

	.muted {
		color: #475569 !important;
	}
</style>
