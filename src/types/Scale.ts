import {
	canonicalNameForSemitone,
	flatNameForSemitone,
	Note,
	PITCH_CLASS_NAMES,
} from "./Note";

// ---------------------------------------------------------------------------
// Scale formula definitions
// ---------------------------------------------------------------------------

export interface ScaleFormula {
	/** Human-readable name, e.g. "Dorian" or "Major Pentatonic" */
	readonly name: string;
	/**
	 * Semitone offsets from the root, sorted ascending, always starting with 0.
	 * E.g. [0, 2, 4, 5, 7, 9, 11] for Major.
	 */
	readonly intervals: readonly number[];
	/**
	 * Degree label for each interval, parallel to `intervals`.
	 * Uses major-relative nomenclature (♭3, #4, ♭7, etc.).
	 * E.g. ["1","2","3","4","5","6","7"] for Major.
	 */
	readonly degreeLabels: readonly string[];
}

export const SCALE_FORMULAS = {
	// Heptatonic modes
	MAJOR: {
		name: "Major",
		intervals: [0, 2, 4, 5, 7, 9, 11],
		degreeLabels: ["1", "2", "3", "4", "5", "6", "7"],
	},
	NATURAL_MINOR: {
		name: "Natural Minor",
		intervals: [0, 2, 3, 5, 7, 8, 10],
		degreeLabels: ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
	},
	DORIAN: {
		name: "Dorian",
		intervals: [0, 2, 3, 5, 7, 9, 10],
		degreeLabels: ["1", "2", "♭3", "4", "5", "6", "♭7"],
	},
	PHRYGIAN: {
		name: "Phrygian",
		intervals: [0, 1, 3, 5, 7, 8, 10],
		degreeLabels: ["1", "♭2", "♭3", "4", "5", "♭6", "♭7"],
	},
	LYDIAN: {
		name: "Lydian",
		intervals: [0, 2, 4, 6, 7, 9, 11],
		degreeLabels: ["1", "2", "3", "#4", "5", "6", "7"],
	},
	MIXOLYDIAN: {
		name: "Mixolydian",
		intervals: [0, 2, 4, 5, 7, 9, 10],
		degreeLabels: ["1", "2", "3", "4", "5", "6", "♭7"],
	},
	LOCRIAN: {
		name: "Locrian",
		intervals: [0, 1, 3, 5, 6, 8, 10],
		degreeLabels: ["1", "♭2", "♭3", "4", "♭5", "♭6", "♭7"],
	},
	HARMONIC_MINOR: {
		name: "Harmonic Minor",
		intervals: [0, 2, 3, 5, 7, 8, 11],
		degreeLabels: ["1", "2", "♭3", "4", "5", "♭6", "7"],
	},
	MELODIC_MINOR: {
		name: "Melodic Minor",
		intervals: [0, 2, 3, 5, 7, 9, 11],
		degreeLabels: ["1", "2", "♭3", "4", "5", "6", "7"],
	},
	// Pentatonic
	MAJOR_PENTATONIC: {
		name: "Major Pentatonic",
		intervals: [0, 2, 4, 7, 9],
		degreeLabels: ["1", "2", "3", "5", "6"],
	},
	MINOR_PENTATONIC: {
		name: "Minor Pentatonic",
		intervals: [0, 3, 5, 7, 10],
		degreeLabels: ["1", "♭3", "4", "5", "♭7"],
	},
	// Blues
	BLUES: {
		name: "Blues",
		intervals: [0, 3, 5, 6, 7, 10],
		degreeLabels: ["1", "♭3", "4", "♭5", "5", "♭7"],
	},
} as const satisfies Record<string, ScaleFormula>;

/** Flat list of all built-in formulas, useful for UI iteration. */
export const ALL_SCALE_FORMULAS: readonly ScaleFormula[] =
	Object.values(SCALE_FORMULAS);

// ---------------------------------------------------------------------------
// Scale class
// ---------------------------------------------------------------------------

/**
 * A concrete scale: a root note + a formula (interval pattern + degree labels).
 *
 * Naming convention (sharp vs flat) is inferred from the root string when
 * constructed with a string, or can be overridden explicitly via `preferFlats`.
 *
 * All pitch-based comparisons ignore octave (pitch-class equality).
 */
export class Scale {
	readonly root: Note;
	readonly formula: ScaleFormula;
	/**
	 * When true, note display names use flat spellings (Bb, Eb, Ab, Db, Gb).
	 * When false, sharp spellings are used (A#, D#, G#, C#, F#).
	 * Inferred from the root string on construction; can be overridden.
	 */
	readonly preferFlats: boolean;

	constructor(
		root: Note | string | number,
		formula: ScaleFormula,
		preferFlats?: boolean,
	) {
		if (typeof root === "string") {
			this.preferFlats = preferFlats ?? Scale.inferPrefersFlatsFromString(root);
			this.root = new Note(root);
		} else if (root instanceof Note) {
			this.preferFlats =
				preferFlats ?? Scale.inferPrefersFlatsFromPitchClass(root);
			this.root = root;
		} else {
			const n = new Note(root);
			this.preferFlats =
				preferFlats ?? Scale.inferPrefersFlatsFromPitchClass(n);
			this.root = n;
		}
		this.formula = formula;
	}

	// Convenience getters that delegate to the formula

	get name(): string {
		return this.formula.name;
	}

	get intervals(): readonly number[] {
		return this.formula.intervals;
	}

	get degreeLabels(): readonly string[] {
		return this.formula.degreeLabels;
	}

	// ---------------------------------------------------------------------------
	// Note access
	// ---------------------------------------------------------------------------

	/** All notes in the scale (one per interval), starting from root. */
	notes(): Note[] {
		return this.formula.intervals.map((i) => this.root.transpose(i));
	}

	/**
	 * The display name for a note within this scale's naming context.
	 * Uses flat spellings when `preferFlats` is true, sharp otherwise.
	 */
	noteName(note: Note): string {
		return this.preferFlats
			? flatNameForSemitone(note.toMidi())
			: note.canonicalName;
	}

	/** All note display names for the scale, ordered by interval. */
	noteNames(): string[] {
		return this.notes().map((n) => this.noteName(n));
	}

	/**
	 * Returns all 12 chromatic pitch-class names ordered by semitone (0–11),
	 * using this scale's flat/sharp preference.  Useful for generating answer
	 * buttons in the quiz UI.
	 */
	allPitchClassNames(): string[] {
		if (this.preferFlats) {
			return Array.from({ length: 12 }, (_, i) => flatNameForSemitone(i));
		}
		return [...PITCH_CLASS_NAMES];
	}

	// ---------------------------------------------------------------------------
	// Query methods
	// ---------------------------------------------------------------------------

	/** Returns true if `note`'s pitch class is diatonic to this scale. */
	contains(note: Note): boolean {
		return this.degreeOf(note) !== null;
	}

	/**
	 * Returns the degree label (e.g. "♭3", "5") for `note`'s pitch class,
	 * or `null` if the note is not diatonic to this scale.
	 */
	degreeOf(note: Note): string | null {
		const notePc = ((note.toMidi() % 12) + 12) % 12;
		const rootPc = ((this.root.toMidi() % 12) + 12) % 12;
		const idx = this.formula.intervals.findIndex(
			(i) => (rootPc + i) % 12 === notePc,
		);
		return idx === -1 ? null : this.formula.degreeLabels[idx];
	}

	// ---------------------------------------------------------------------------
	// Transformation
	// ---------------------------------------------------------------------------

	/**
	 * Returns a new Scale with the same formula transposed by `semitones`,
	 * re-inferring the flat/sharp preference from the new root.
	 */
	transpose(semitones: number): Scale {
		return new Scale(this.root.transpose(semitones), this.formula);
	}

	// ---------------------------------------------------------------------------
	// Display
	// ---------------------------------------------------------------------------

	/** E.g. "D Dorian" or "Bb Major". */
	toString(): string {
		return `${this.noteName(this.root)} ${this.formula.name}`;
	}

	// ---------------------------------------------------------------------------
	// Static helpers
	// ---------------------------------------------------------------------------

	/**
	 * Infers flat preference from a root string.
	 * "Bb", "Eb", "Ab", "Db", "Gb", "Fb" → true; everything else → false.
	 */
	private static inferPrefersFlatsFromString(root: string): boolean {
		const trimmed = root.trim();
		// Matches a lowercase 'b' after the letter (but not the note 'B' natural)
		return (
			trimmed.length > 1 &&
			trimmed[1] === "b" &&
			trimmed[0].toUpperCase() !== "B"
		);
	}

	/**
	 * Fallback when only a Note (or MIDI number) is available.
	 * Db(1), Eb(3), Ab(8), Bb(10) are the unambiguous flat roots.
	 * F(5) is a flat-key root in major context but its root name has no accidental;
	 * we return false so "F" displays naturally without making every other scale use flats.
	 * Gb(6) is ambiguous with F#; defaults to false (F#/sharp convention).
	 */
	private static inferPrefersFlatsFromPitchClass(root: Note): boolean {
		const pc = ((root.toMidi() % 12) + 12) % 12;
		return [1, 3, 8, 10].includes(pc); // Db, Eb, Ab, Bb
	}

	/**
	 * Returns the pitch-class name (using this scale's naming convention) for
	 * a raw semitone value 0–11.  Useful for mapping button indices to labels.
	 */
	static pitchClassNameForSemitone(
		semitone: number,
		preferFlats: boolean,
	): string {
		return preferFlats
			? flatNameForSemitone(semitone)
			: canonicalNameForSemitone(semitone);
	}
}
