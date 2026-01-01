import { Note } from './Note';

// Minimal Chord implementation (MVP)
// - Accepts up to 6 notes (Note | string | number)
// - Normalizes inputs to Note instances
// - By default sorts notes by ascending MIDI number (preserveVoicing = false)
// - Removes exact-duplicate pitches (same MIDI number)

const PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type PitchClass = typeof PITCH_CLASS_NAMES[number];

export type ChordType =
	| 'maj'
	| 'm'
	| 'dim'
	| 'aug'
	| 'sus2'
	| 'sus4'
	| 'maj7'
	| '7'
	| 'm7'
	| 'm7b5'
	| 'dim7';

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
		const sym = this.symbol();
		const notes = this.notes.map((n) => n.toString()).join(' ');
		if (sym) return `${sym} (${notes})`;
		return notes;
	}

	// Return a chord symbol like 'C', 'Am', 'Cmaj7', or null if unknown
	symbol(): string | null {
		const q = this.quality();
		if (!q) return null;
		const { root, type } = q;
		const SUFFIX_MAP: Record<ChordType, string> = {
			maj: '',
			m: 'm',
			dim: 'dim',
			aug: 'aug',
			sus2: 'sus2',
			sus4: 'sus4',
			maj7: 'maj7',
			'7': '7',
			m7: 'm7',
			m7b5: 'm7b5',
			dim7: 'dim7'
		};
		const suffix = SUFFIX_MAP[type] ?? type;
		return `${root}${suffix}`;
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

	// Invert the chord by moving the lowest note up one octave, repeated n times
	invert(n = 1): Chord {
		if (this.notes.length === 0 || n <= 0) return new Chord(this.notes.slice(), this.preserveVoicing);
		// Work on a copy of the current internal order
		const notesCopy = this.notes.map((x) => x);
		for (let i = 0; i < n; i++) {
			const low = notesCopy.shift();
			if (!low) break;
			notesCopy.push(new Note(low.toMidi() + 12));
		}
		return new Chord(notesCopy, this.preserveVoicing);
	}

	// Return all inversions of the chord (0..size-1)
	allInversions(): Chord[] {
		const results: Chord[] = [];
		let current = new Chord(this.notes.slice(), this.preserveVoicing);
		results.push(current);
		for (let i = 1; i < this.notes.length; i++) {
			current = current.invert(1);
			results.push(current);
		}
		return results;
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

	// Detect basic chord quality using pitch-class sets. Returns { root: 'C', type: 'maj' } or null if unknown
	quality(): { root: PitchClass; type: ChordType } | null {
		if (this.notes.length === 0) return null;

		// Build unique pitch-class set (0..11)
		const pcs = Array.from(new Set(this.notes.map((n) => n.toMidi() % 12))).sort((a, b) => a - b);
		if (pcs.length === 0) return null;

		// Map of interval signature to chord type
		const PATTERNS: Record<string, ChordType> = {
			'0,4,7': 'maj',
			'0,3,7': 'm',
			'0,3,6': 'dim',
			'0,4,8': 'aug',
			'0,2,7': 'sus2',
			'0,5,7': 'sus4',
			'0,4,7,11': 'maj7',
			'0,4,7,10': '7',
			'0,3,7,10': 'm7',
			'0,3,6,10': 'm7b5',
			'0,3,6,9': 'dim7'
		};

		// Try each rotation (consider inversions): pick each pitch class as root
		for (let i = 0; i < pcs.length; i++) {
			const root = pcs[i];
			const intervals = pcs.map((pc) => ((pc - root) % 12 + 12) % 12).sort((a, b) => a - b);
			const key = intervals.join(',');
			if (PATTERNS[key]) {
				return { root: PITCH_CLASS_NAMES[root], type: PATTERNS[key] };
			}
		}

		// Not recognized
		return null;
	}
}
