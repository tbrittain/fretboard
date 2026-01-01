import { Note } from './Note';

// Minimal Chord implementation (MVP)
// - Accepts up to 6 notes (Note | string | number)
// - Normalizes inputs to Note instances
// - By default sorts notes by ascending MIDI number (preserveVoicing = false)
// - Removes exact-duplicate pitches (same MIDI number)

export class Chord {
	public readonly notes: Note[];
	public readonly preserveVoicing: boolean;

	constructor(inputs: Array<Note | string | number>, preserveVoicing = false) {
		if (!Array.isArray(inputs)) throw new Error('Chord constructor expects an array of notes');
		if (inputs.length > 6) throw new Error('Chord supports up to 6 notes');

		this.preserveVoicing = !!preserveVoicing;

		// Normalize inputs to Note instances
		const normalized: Note[] = inputs.map((i) => {
			if (i instanceof Note) return i;
			if (typeof i === 'number') return new Note(i);
			if (typeof i === 'string') return new Note(i);
			throw new Error('Unsupported note input type');
		});

		// Optionally sort by ascending MIDI number
		if (!this.preserveVoicing) {
			normalized.sort((a, b) => a.toMidi() - b.toMidi());
		}

		// Remove exact duplicate pitches (same MIDI number) while preserving order
		const seen = new Set<number>();
		const deduped: Note[] = [];
		for (const n of normalized) {
			const m = n.toMidi();
			if (!seen.has(m)) {
				seen.add(m);
				deduped.push(n);
			}
		}

		this.notes = deduped;
	}

	// Return space-separated canonical note names in current internal order
	toString(): string {
		return this.notes.map((n) => n.toString()).join(' ');
	}

	// Return MIDI numbers in current internal order
	toMidi(): number[] {
		return this.notes.map((n) => n.toMidi());
	}

	// Return a new Chord transposed by semitones
	transpose(semitones: number): Chord {
		const transposed = this.notes.map((n) => n.transpose(semitones));
		return new Chord(transposed, this.preserveVoicing);
	}

	// Return intervals in semitones from the chosen root (default first note in internal order)
	intervalsFromRoot(rootIndex = 0): number[] {
		if (this.notes.length === 0) return [];
		if (rootIndex < 0 || rootIndex >= this.notes.length) throw new Error('rootIndex out of range');
		const rootMidi = this.notes[rootIndex].toMidi();
		return this.notes.map((n) => ((n.toMidi() - rootMidi) % 12 + 12) % 12);
	}

	// True if chord contains a given note (by enharmonic equality)
	contains(n: Note | string | number): boolean {
		let needle: Note;
		if (n instanceof Note) needle = n;
		else if (typeof n === 'number') needle = new Note(n);
		else if (typeof n === 'string') needle = new Note(n);
		else throw new Error('Unsupported note input type');

		return this.notes.some((m) => m.equalsEnharmonic(needle));
	}

	// Equality ignoring order and duplicate counts: same set of MIDI pitches
	equals(other: Chord): boolean {
		const a = Array.from(new Set(this.toMidi())).sort((x, y) => x - y);
		const b = Array.from(new Set(other.toMidi())).sort((x, y) => x - y);
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
		return true;
	}

	// Return a new Chord with the note added (enforces max 6-note rule)
	withAdded(n: Note | string | number): Chord {
		let noteObj: Note;
		if (n instanceof Note) noteObj = n;
		else if (typeof n === 'number') noteObj = new Note(n);
		else if (typeof n === 'string') noteObj = new Note(n);
		else throw new Error('Unsupported note input type');

		const newInputs = [...this.notes, noteObj];
		if (newInputs.length > 6) throw new Error('Chord supports up to 6 notes');
		return new Chord(newInputs, this.preserveVoicing);
	}

	// Return a new Chord with the first matching enharmonic note removed
	without(n: Note | string | number): Chord {
		let needle: Note;
		if (n instanceof Note) needle = n;
		else if (typeof n === 'number') needle = new Note(n);
		else if (typeof n === 'string') needle = new Note(n);
		else throw new Error('Unsupported note input type');

		const filtered = this.notes.filter((m) => !m.equalsEnharmonic(needle));
		return new Chord(filtered, this.preserveVoicing);
	}

	get size(): number {
		return this.notes.length;
	}
}

