export const PITCH_CLASS_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
] as const;
export type PitchClass = (typeof PITCH_CLASS_NAMES)[number];

const NOTE_TO_SEMITONE: Record<string, number> = {
	C: 0,
	"C#": 1,
	D: 2,
	"D#": 3,
	E: 4,
	F: 5,
	"F#": 6,
	G: 7,
	"G#": 8,
	A: 9,
	"A#": 10,
	B: 11,
	// flats mapped to same semitone as their enharmonic sharp
	Db: 1,
	Eb: 3,
	Gb: 6,
	Ab: 8,
	Bb: 10,
	Cb: 11,
	Fb: 4,
	"B#": 0,
	"E#": 5,
};

// Export a helper to get the flat-preferred pitch-class name for a semitone value (e.g. 1 → 'Db', 10 → 'Bb')
export function flatNameForSemitone(midi: number): string {
	const semitone = ((midi % 12) + 12) % 12;
	switch (semitone) {
		case 0:
			return "C";
		case 1:
			return "Db";
		case 2:
			return "D";
		case 3:
			return "Eb";
		case 4:
			return "E";
		case 5:
			return "F";
		case 6:
			return "Gb";
		case 7:
			return "G";
		case 8:
			return "Ab";
		case 9:
			return "A";
		case 10:
			return "Bb";
		case 11:
			return "B";
		default:
			return "C";
	}
}

// Export a helper to get the canonical pitch-class name for a semitone value
export function canonicalNameForSemitone(midi: number): PitchClass {
	const semitone =
		((midi % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) %
		SEMITONES_PER_OCTAVE;
	switch (semitone) {
		case 0:
			return "C";
		case 1:
			return "C#";
		case 2:
			return "D";
		case 3:
			return "D#";
		case 4:
			return "E";
		case 5:
			return "F";
		case 6:
			return "F#";
		case 7:
			return "G";
		case 8:
			return "G#";
		case 9:
			return "A";
		case 10:
			return "A#";
		case 11:
			return "B";
		default:
			return "C";
	}
}

const SEMITONES_PER_OCTAVE = 12;
const DEFAULT_OCTAVE = 4; // middle-C octave for unspecified octave input

export class Note {
	private readonly midiNumber: number; // store as MIDI-like absolute semitone (C-1 = 0 convention won't be strictly necessary)
	readonly canonicalName: string; // prefer sharp names for toString (e.g., C#, D)
	private readonly octave: number;

	// Public constructor overloads: either (name: string, octave?: number) or (midi: number)
	constructor(name: string, octave?: number);
	constructor(midi: number);
	constructor(nameOrMidi: string | number, octave?: number) {
		if (typeof nameOrMidi === "number") {
			this.midiNumber = nameOrMidi;
			const { name, octave: oct } = Note.decomposeMidi(nameOrMidi);
			this.canonicalName = name;
			this.octave = oct;
		} else {
			const parsed = Note.parse(
				nameOrMidi + (octave !== undefined ? String(octave) : ""),
			);
			this.midiNumber = parsed.midi;
			this.canonicalName = parsed.name;
			this.octave = parsed.octave;
		}
	}

	// Return a human-friendly representation like 'C#4' or 'Bb3'
	toString(): string {
		return `${this.canonicalName}${this.octave}`;
	}

	// Return MIDI-style number where C4 === 60
	toMidi(): number {
		return this.midiNumber;
	}

	// Return a new Note transposed by the given number of semitones (can be negative)
	transpose(semitones: number): Note {
		return new Note(this.midiNumber + semitones);
	}

	// Number of semitone steps from this note to another (other - this)
	intervalTo(other: Note): number {
		return other.midiNumber - this.midiNumber;
	}

	// True if two notes are enharmonically the same pitch (same absolute semitone)
	equalsEnharmonic(other: Note): boolean {
		return this.midiNumber === other.midiNumber;
	}

	// True if two notes have the same pitch class (ignoring octave)
	equalsPitchClass(other: Note): boolean {
		return (
			this.midiNumber % SEMITONES_PER_OCTAVE ===
			other.midiNumber % SEMITONES_PER_OCTAVE
		);
	}

	// Parse a string like 'C4', 'C#4', 'Db3', 'A', 'g#5' -> returns { name, octave, midi }
	static parse(input: string): { name: string; octave: number; midi: number } {
		if (!input || typeof input !== "string") {
			throw new Error("Invalid note input");
		}

		const s = input.trim();
		// regex: capture note letters (A-G), optional accidental (# or b), optional octave (signed integer)
		const m = /^([A-Ga-g])([#b]?)(-?\d+)?$/.exec(s);
		if (!m) throw new Error(`Invalid note format: ${input}`);
		let [, letter, accidental, octaveStr] = m;
		letter = letter.toUpperCase();
		const nameKey = accidental ? letter + accidental : letter;

		const octave =
			octaveStr !== undefined ? parseInt(octaveStr, 10) : DEFAULT_OCTAVE;

		// Handle special cases like B# -> behaves like C of next octave, Cb -> behaves like B of previous octave
		let semitone = NOTE_TO_SEMITONE[nameKey];
		if (semitone === undefined) {
			// Try normalized forms (upper-case accidental)
			const normalizedKey = letter + (accidental || "");
			semitone = NOTE_TO_SEMITONE[normalizedKey];
		}
		if (semitone === undefined) {
			throw new Error(`Unsupported note name: ${nameKey}`);
		}

		// For edge-case accidentals that map outside 0..11 (handled by mapping above), adjust octave
		// We'll compute an absolute semitone where C4 == 60
		let midi = Note.semitoneToMidi(semitone, octave);

		// Adjust for inputs like B# (B# mapped to semitone 0 but still same octave +1)
		// We can detect this by reconstructing base letter semitone and comparing
		// Simpler approach: if the textual name indicates a natural letter and accidental that crosses octave boundaries,
		// use a small set: B# -> semitone 0 but should be octave+1; Cb -> semitone 11 but octave-1; E# -> F (semitone 5) but same octave; Fb -> E

		if (nameKey === "B#") {
			midi = Note.semitoneToMidi(0, octave + 1);
		} else if (nameKey === "Cb") {
			midi = Note.semitoneToMidi(11, octave - 1);
		} else if (nameKey === "E#") {
			// E# is F in same octave
			midi = Note.semitoneToMidi(5, octave);
		} else if (nameKey === "Fb") {
			// Fb is E in same octave
			midi = Note.semitoneToMidi(4, octave);
		}

		// Choose a canonical name: prefer sharps for display when semitone is a sharp key
		const canonical = canonicalNameForSemitone(midi);

		return { name: canonical, octave: Note.midiToOctave(midi), midi };
	}

	private static semitoneToMidi(semitone: number, octave: number) {
		// MIDI convention: C4 = 60. Semitone 0 is C. So midi = (octave + 1) * 12 ?
		// Use formula: midi = (octave + 1) * 12 + semitone where octave 4 -> (4 + 1)*12 = 60 base for C4
		return (
			(octave + 1) * SEMITONES_PER_OCTAVE +
			(((semitone % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) %
				SEMITONES_PER_OCTAVE)
		);
	}

	private static midiToOctave(midi: number) {
		// inverse of semitoneToMidi: octave = floor(midi/12) - 1
		return Math.floor(midi / SEMITONES_PER_OCTAVE) - 1;
	}

	private static decomposeMidi(midi: number) {
		const octave = Note.midiToOctave(midi);
		const name = canonicalNameForSemitone(midi);
		return { name, octave };
	}
}
