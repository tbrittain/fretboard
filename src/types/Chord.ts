import { Note, PITCH_CLASS_NAMES, type PitchClass } from "./Note";

export type ChordType =
	| "maj"
	| "m"
	| "dim"
	| "aug"
	| "sus2"
	| "sus4"
	| "maj7"
	| "7"
	| "m7"
	| "m7b5"
	| "dim7";

export type VoicingOptions = {
	mode?: "close" | "open";
	maxSpread?: number; // in semitones
	doubling?: "root" | "fifth" | "none";
	bass?: Note | string | number;
};

export class Chord {
	public readonly notes: Note[];
	public readonly preserveVoicing: boolean;

	constructor(inputs: Array<Note | string | number>, preserveVoicing = false) {
		if (!Array.isArray(inputs))
			throw new Error("Chord constructor expects an array of notes");
		if (inputs.length > 6) throw new Error("Chord supports up to 6 notes");

		this.preserveVoicing = !!preserveVoicing;

		// Normalize inputs to Note instances
		const normalized: Note[] = inputs.map((i) => {
			if (i instanceof Note) return i;
			if (typeof i === "number") return new Note(i);
			if (typeof i === "string") return new Note(i);
			throw new Error("Unsupported note input type");
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
		const notes = this.notes.map((n) => n.toString()).join(" ");
		if (sym) return `${sym} (${notes})`;
		return notes;
	}

	// Return a chord symbol like 'C', 'Am', 'Cmaj7', or null if unknown
	symbol(): string | null {
		const q = this.quality();
		if (!q) return null;
		const { root, type } = q;
		const SUFFIX_MAP: Record<ChordType, string> = {
			maj: "",
			m: "m",
			dim: "dim",
			aug: "aug",
			sus2: "sus2",
			sus4: "sus4",
			maj7: "maj7",
			"7": "7",
			m7: "m7",
			m7b5: "m7b5",
			dim7: "dim7",
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
		if (rootIndex < 0 || rootIndex >= this.notes.length)
			throw new Error("rootIndex out of range");
		const rootMidi = this.notes[rootIndex].toMidi();
		return this.notes.map((n) => (((n.toMidi() - rootMidi) % 12) + 12) % 12);
	}

	// Invert the chord by moving the lowest note up one octave, repeated n times
	invert(n = 1): Chord {
		if (this.notes.length === 0 || n <= 0)
			return new Chord(this.notes.slice(), this.preserveVoicing);
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

	// Simple helper: produce a close-position voicing (minimal ascensions within octave)
	private closeVoicingNotes(): Note[] {
		if (this.notes.length === 0) return [];
		const out: Note[] = [this.notes[0]];
		let prev = out[0].toMidi();
		for (let i = 1; i < this.notes.length; i++) {
			let midi = this.notes[i].toMidi();
			while (midi <= prev) midi += 12;
			out.push(new Note(midi));
			prev = midi;
		}
		return out;
	}

	// Simple helper: produce an "open" voicing by moving every other note up an octave from close voicing
	private openVoicingNotes(): Note[] {
		const close = this.closeVoicingNotes();
		const out = close.map((n) => n);
		for (let i = 1; i < out.length; i += 2) {
			out[i] = new Note(out[i].toMidi() + 12);
		}
		// ensure ascending order
		out.sort((a, b) => a.toMidi() - b.toMidi());
		return out;
	}

	// Apply doubling by adding an extra root or fifth above the current highest note
	private applyDoubling(
		notes: Note[],
		doubling?: "root" | "fifth" | "none",
	): Note[] {
		if (!doubling || doubling === "none") return notes.slice();
		// Enforce 6-note cap: doubling would add one note
		if (notes.length >= 6)
			throw new Error("Doubling would exceed 6-note chord limit");
		const midiList = notes.map((n) => n.toMidi());
		const highest = Math.max(...midiList);
		// determine root pitch class
		const q = this.quality();
		let targetPc: number | null = null;
		if (doubling === "root" && q) {
			targetPc = PITCH_CLASS_NAMES.indexOf(q.root as PitchClass);
		} else if (doubling === "fifth" && q) {
			// fifth is root + 7
			const rootPc = PITCH_CLASS_NAMES.indexOf(q.root as PitchClass);
			if (rootPc >= 0) targetPc = (rootPc + 7) % 12;
		}
		if (targetPc == null) return notes.slice();
		// compute a candidate midi for the doubled tone just above highest
		const octave = Math.floor(highest / 12) + 1;
		const candidate = octave * 12 + targetPc;
		// avoid exact duplicate
		if (midiList.includes(candidate)) return notes.slice();
		return [...notes, new Note(candidate)];
	}

	// Try to reduce spread if exceeds maxSpread by moving top notes down an octave
	private enforceMaxSpread(notes: Note[], maxSpread?: number): Note[] {
		if (!maxSpread || notes.length === 0) return notes.slice();
		const out = notes.map((n) => n);
		// normalize ascending
		out.sort((a, b) => a.toMidi() - b.toMidi());
		let min = Math.min(...out.map((n) => n.toMidi()));
		let max = Math.max(...out.map((n) => n.toMidi()));
		let spread = max - min;
		// Attempt to reduce spread by moving the highest down or the lowest up when it improves spread
		let attempts = 0;
		while (spread > maxSpread && attempts < 12) {
			const midis = out.map((n) => n.toMidi());
			const hiIndex = midis.indexOf(Math.max(...midis));
			const loIndex = midis.indexOf(Math.min(...midis));

			// candidate if we lower highest by an octave
			const downMidis = midis.slice();
			downMidis[hiIndex] = downMidis[hiIndex] - 12;
			const downMin = Math.min(...downMidis);
			const downMax = Math.max(...downMidis);
			const downSpread = downMax - downMin;

			// candidate if we raise lowest by an octave
			const upMidis = midis.slice();
			upMidis[loIndex] = upMidis[loIndex] + 12;
			const upMin = Math.min(...upMidis);
			const upMax = Math.max(...upMidis);
			const upSpread = upMax - upMin;

			// pick the best improvement
			let best = spread;
			let action: "none" | "down" | "up" = "none";
			if (downSpread < best) {
				best = downSpread;
				action = "down";
			}
			if (upSpread < best) {
				best = upSpread;
				action = "up";
			}

			if (action === "none") break; // no improvement possible

			if (action === "down") {
				out[hiIndex] = new Note(out[hiIndex].toMidi() - 12);
			} else if (action === "up") {
				out[loIndex] = new Note(out[loIndex].toMidi() + 12);
			}

			// recompute spread
			min = Math.min(...out.map((n) => n.toMidi()));
			max = Math.max(...out.map((n) => n.toMidi()));
			spread = max - min;
			// keep loop conservative
			attempts++;
		}
		// sort ascending
		out.sort((a, b) => a.toMidi() - b.toMidi());
		return out;
	}

	// Generate voicings based on options. Returns an array (currently single voicing) for easy future expansion.
	voicings(options: VoicingOptions = {}): Chord[] {
		const mode = options.mode || "close";
		let notes =
			mode === "open" ? this.openVoicingNotes() : this.closeVoicingNotes();
		// apply doubling if requested
		notes = this.applyDoubling(notes, options.doubling || "none");
		// enforce spread
		notes = this.enforceMaxSpread(notes, options.maxSpread);
		let chord = new Chord(notes, false);
		// set bass if requested
		if (options.bass) chord = chord.setBass(options.bass);
		return [chord];
	}

	// Set the chord's bass to the requested note (by inversion rotation + transpose). Returns a new Chord.
	setBass(bass: Note | string | number): Chord {
		let desired: Note;
		if (bass instanceof Note) desired = bass;
		else if (typeof bass === "number") desired = new Note(bass);
		else if (typeof bass === "string") desired = new Note(bass);
		else throw new Error("Unsupported bass input type");

		const desiredMidi = desired.toMidi();
		const desiredPc = desiredMidi % 12;

		// Try to find an inversion whose lowest pitch class matches desiredPc, then transpose to exact desiredMidi
		for (let i = 0; i < this.notes.length; i++) {
			const inv = this.invert(i);
			const lowest = inv.notes[0];
			if (lowest.toMidi() % 12 === desiredPc) {
				const delta = desiredMidi - lowest.toMidi();
				return inv.transpose(delta);
			}
		}

		// Fallback: try to transpose whole chord so lowest becomes desiredPc (closest octave)
		const baseLowest = this.notes[0];
		const basePc = baseLowest.toMidi() % 12;
		const deltaPc = (desiredPc - basePc + 12) % 12;
		const candidate = this.transpose(deltaPc);
		// adjust octave if necessary to get exact desiredMidi
		const lowMidi = candidate.notes[0].toMidi();
		const octaveShift = desiredMidi - lowMidi;
		return candidate.transpose(octaveShift);
	}

	// True if chord contains a given note (by enharmonic equality)
	contains(n: Note | string | number): boolean {
		let needle: Note;
		if (n instanceof Note) needle = n;
		else if (typeof n === "number") needle = new Note(n);
		else if (typeof n === "string") needle = new Note(n);
		else throw new Error("Unsupported note input type");

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
		else if (typeof n === "number") noteObj = new Note(n);
		else if (typeof n === "string") noteObj = new Note(n);
		else throw new Error("Unsupported note input type");

		const newInputs = [...this.notes, noteObj];
		if (newInputs.length > 6) throw new Error("Chord supports up to 6 notes");
		return new Chord(newInputs, this.preserveVoicing);
	}

	// Return a new Chord with the first matching enharmonic note removed
	without(n: Note | string | number): Chord {
		let needle: Note;
		if (n instanceof Note) needle = n;
		else if (typeof n === "number") needle = new Note(n);
		else if (typeof n === "string") needle = new Note(n);
		else throw new Error("Unsupported note input type");

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
		const pcs = Array.from(
			new Set(this.notes.map((n) => n.toMidi() % 12)),
		).sort((a, b) => a - b);
		if (pcs.length === 0) return null;

		// Map of interval signature to chord type
		const PATTERNS: Record<string, ChordType> = {
			"0,4,7": "maj",
			"0,3,7": "m",
			"0,3,6": "dim",
			"0,4,8": "aug",
			"0,2,7": "sus2",
			"0,5,7": "sus4",
			"0,4,7,11": "maj7",
			"0,4,7,10": "7",
			"0,3,7,10": "m7",
			"0,3,6,10": "m7b5",
			"0,3,6,9": "dim7",
		};

		// Try each rotation (consider inversions): pick each pitch class as root
		for (let i = 0; i < pcs.length; i++) {
			const root = pcs[i];
			const intervals = pcs
				.map((pc) => (((pc - root) % 12) + 12) % 12)
				.sort((a, b) => a - b);
			const key = intervals.join(",");
			if (PATTERNS[key]) {
				return { root: PITCH_CLASS_NAMES[root], type: PATTERNS[key] };
			}
		}

		// Not recognized
		return null;
	}
}
