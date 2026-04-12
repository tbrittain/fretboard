import { describe, expect, it } from "vitest";
import { Note } from "../Note";
import { Scale, SCALE_FORMULAS, ALL_SCALE_FORMULAS } from "../Scale";

// ---------------------------------------------------------------------------
// SCALE_FORMULAS catalogue
// ---------------------------------------------------------------------------

describe("SCALE_FORMULAS", () => {
	it("every formula has intervals starting with 0 and in ascending order", () => {
		for (const formula of ALL_SCALE_FORMULAS) {
			expect(formula.intervals[0]).toBe(0);
			for (let i = 1; i < formula.intervals.length; i++) {
				expect(formula.intervals[i]).toBeGreaterThan(formula.intervals[i - 1]);
			}
		}
	});

	it("every formula has degreeLabels of the same length as intervals", () => {
		for (const formula of ALL_SCALE_FORMULAS) {
			expect(formula.degreeLabels.length).toBe(formula.intervals.length);
		}
	});

	it("every formula has all intervals in 1–11 (after the root)", () => {
		for (const formula of ALL_SCALE_FORMULAS) {
			for (const interval of formula.intervals.slice(1)) {
				expect(interval).toBeGreaterThanOrEqual(1);
				expect(interval).toBeLessThanOrEqual(11);
			}
		}
	});

	it("Major formula has the expected intervals and labels", () => {
		expect(SCALE_FORMULAS.MAJOR.intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
		expect(SCALE_FORMULAS.MAJOR.degreeLabels).toEqual([
			"1", "2", "3", "4", "5", "6", "7",
		]);
	});

	it("Natural Minor formula has the expected intervals", () => {
		expect(SCALE_FORMULAS.NATURAL_MINOR.intervals).toEqual([
			0, 2, 3, 5, 7, 8, 10,
		]);
	});

	it("Blues formula has the expected intervals", () => {
		expect(SCALE_FORMULAS.BLUES.intervals).toEqual([0, 3, 5, 6, 7, 10]);
	});
});

// ---------------------------------------------------------------------------
// Scale construction
// ---------------------------------------------------------------------------

describe("Scale construction", () => {
	it("constructs from a string root", () => {
		const s = new Scale("D", SCALE_FORMULAS.MAJOR);
		expect(s.root.canonicalName).toBe("D");
		expect(s.name).toBe("Major");
	});

	it("constructs from a Note root", () => {
		const s = new Scale(new Note("A"), SCALE_FORMULAS.DORIAN);
		expect(s.root.canonicalName).toBe("A");
	});

	it("constructs from a MIDI number root", () => {
		const s = new Scale(60, SCALE_FORMULAS.MAJOR); // MIDI 60 = C4
		expect(s.root.canonicalName).toBe("C");
	});

	it("infers preferFlats=true for flat-root strings (Bb, Eb, Ab, Db)", () => {
		expect(new Scale("Bb", SCALE_FORMULAS.MAJOR).preferFlats).toBe(true);
		expect(new Scale("Eb", SCALE_FORMULAS.MAJOR).preferFlats).toBe(true);
		expect(new Scale("Ab", SCALE_FORMULAS.MAJOR).preferFlats).toBe(true);
		expect(new Scale("Db", SCALE_FORMULAS.MAJOR).preferFlats).toBe(true);
	});

	it("infers preferFlats=false for natural and sharp-root strings", () => {
		expect(new Scale("C", SCALE_FORMULAS.MAJOR).preferFlats).toBe(false);
		expect(new Scale("G", SCALE_FORMULAS.MAJOR).preferFlats).toBe(false);
		expect(new Scale("F#", SCALE_FORMULAS.MAJOR).preferFlats).toBe(false);
		expect(new Scale("B", SCALE_FORMULAS.MAJOR).preferFlats).toBe(false);
	});

	it("does not treat 'B' natural as a flat root", () => {
		expect(new Scale("B", SCALE_FORMULAS.MAJOR).preferFlats).toBe(false);
	});

	it("allows overriding preferFlats explicitly", () => {
		const s = new Scale("G", SCALE_FORMULAS.MAJOR, true);
		expect(s.preferFlats).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Scale.notes()
// ---------------------------------------------------------------------------

describe("Scale.notes()", () => {
	it("returns the correct note objects for C Major", () => {
		const s = new Scale("C", SCALE_FORMULAS.MAJOR);
		const names = s.notes().map((n) => n.canonicalName);
		expect(names).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
	});

	it("returns the correct notes for D Major", () => {
		const s = new Scale("D", SCALE_FORMULAS.MAJOR);
		const names = s.notes().map((n) => n.canonicalName);
		expect(names).toEqual(["D", "E", "F#", "G", "A", "B", "C#"]);
	});

	it("returns the correct notes for A Natural Minor", () => {
		const s = new Scale("A", SCALE_FORMULAS.NATURAL_MINOR);
		const names = s.notes().map((n) => n.canonicalName);
		expect(names).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});

	it("returns the correct notes for G Mixolydian", () => {
		const s = new Scale("G", SCALE_FORMULAS.MIXOLYDIAN);
		const names = s.notes().map((n) => n.canonicalName);
		expect(names).toEqual(["G", "A", "B", "C", "D", "E", "F"]);
	});

	it("returns 5 notes for a pentatonic scale", () => {
		const s = new Scale("A", SCALE_FORMULAS.MINOR_PENTATONIC);
		expect(s.notes()).toHaveLength(5);
	});

	it("returns 6 notes for the Blues scale", () => {
		const s = new Scale("A", SCALE_FORMULAS.BLUES);
		expect(s.notes()).toHaveLength(6);
	});
});

// ---------------------------------------------------------------------------
// Scale.noteNames() — flat/sharp display
// ---------------------------------------------------------------------------

describe("Scale.noteNames()", () => {
	it("uses flat names for Bb Major", () => {
		const s = new Scale("Bb", SCALE_FORMULAS.MAJOR);
		expect(s.noteNames()).toEqual(["Bb", "C", "D", "Eb", "F", "G", "A"]);
	});

	it("uses flat names for Eb Major", () => {
		const s = new Scale("Eb", SCALE_FORMULAS.MAJOR);
		expect(s.noteNames()).toEqual(["Eb", "F", "G", "Ab", "Bb", "C", "D"]);
	});

	it("uses sharp names for D Major", () => {
		const s = new Scale("D", SCALE_FORMULAS.MAJOR);
		expect(s.noteNames()).toEqual(["D", "E", "F#", "G", "A", "B", "C#"]);
	});

	it("uses flat names for D Dorian (root is D, but preferFlats override applied)", () => {
		// D Dorian: 1,2,♭3,4,5,6,♭7 = D E F G A B C — no accidentals on root,
		// so by default preferFlats=false; ♭3 and ♭7 render as F and C (naturals here).
		const s = new Scale("D", SCALE_FORMULAS.DORIAN);
		expect(s.noteNames()).toEqual(["D", "E", "F", "G", "A", "B", "C"]);
	});
});

// ---------------------------------------------------------------------------
// Scale.contains()
// ---------------------------------------------------------------------------

describe("Scale.contains()", () => {
	it("returns true for diatonic notes and false for chromatic notes (C Major)", () => {
		const s = new Scale("C", SCALE_FORMULAS.MAJOR);
		expect(s.contains(new Note("F"))).toBe(true);
		expect(s.contains(new Note("B"))).toBe(true);
		expect(s.contains(new Note("F#"))).toBe(false);
		expect(s.contains(new Note("Bb"))).toBe(false);
	});

	it("is octave-independent", () => {
		const s = new Scale("C", SCALE_FORMULAS.MAJOR);
		expect(s.contains(new Note("G3"))).toBe(true);
		expect(s.contains(new Note("G7"))).toBe(true);
	});

	it("handles enharmonic equivalents correctly (A# ≡ Bb in A Minor Pentatonic)", () => {
		const s = new Scale("A", SCALE_FORMULAS.MINOR_PENTATONIC);
		// Minor Pentatonic: A C D E G — ♭7 of A is G, so A# is not in scale
		expect(s.contains(new Note("A"))).toBe(true);
		expect(s.contains(new Note("C"))).toBe(true);
		expect(s.contains(new Note("G"))).toBe(true);
		expect(s.contains(new Note("B"))).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Scale.degreeOf()
// ---------------------------------------------------------------------------

describe("Scale.degreeOf()", () => {
	it("returns the correct degree label for diatonic notes (C Major)", () => {
		const s = new Scale("C", SCALE_FORMULAS.MAJOR);
		expect(s.degreeOf(new Note("C"))).toBe("1");
		expect(s.degreeOf(new Note("E"))).toBe("3");
		expect(s.degreeOf(new Note("G"))).toBe("5");
		expect(s.degreeOf(new Note("B"))).toBe("7");
	});

	it("returns null for non-diatonic notes", () => {
		const s = new Scale("C", SCALE_FORMULAS.MAJOR);
		expect(s.degreeOf(new Note("F#"))).toBeNull();
		expect(s.degreeOf(new Note("Bb"))).toBeNull();
	});

	it("labels ♭7 correctly in Mixolydian (G)", () => {
		const s = new Scale("G", SCALE_FORMULAS.MIXOLYDIAN);
		expect(s.degreeOf(new Note("F"))).toBe("♭7");
		expect(s.degreeOf(new Note("G"))).toBe("1");
		expect(s.degreeOf(new Note("D"))).toBe("5");
	});

	it("labels ♭3 and ♭7 in A Minor Pentatonic", () => {
		const s = new Scale("A", SCALE_FORMULAS.MINOR_PENTATONIC);
		expect(s.degreeOf(new Note("C"))).toBe("♭3");
		expect(s.degreeOf(new Note("G"))).toBe("♭7");
	});

	it("is octave-independent", () => {
		const s = new Scale("C", SCALE_FORMULAS.MAJOR);
		expect(s.degreeOf(new Note("G2"))).toBe("5");
		expect(s.degreeOf(new Note("G6"))).toBe("5");
	});

	it("works for a non-C root: E Major", () => {
		const s = new Scale("E", SCALE_FORMULAS.MAJOR);
		// E Major: E F# G# A B C# D#
		expect(s.degreeOf(new Note("F#"))).toBe("2");
		expect(s.degreeOf(new Note("G#"))).toBe("3");
		expect(s.degreeOf(new Note("D#"))).toBe("7");
		expect(s.degreeOf(new Note("G"))).toBeNull(); // G natural not in E Major
	});
});

// ---------------------------------------------------------------------------
// Scale.transpose()
// ---------------------------------------------------------------------------

describe("Scale.transpose()", () => {
	it("shifts the root by the given semitones and keeps the same formula", () => {
		const c = new Scale("C", SCALE_FORMULAS.MAJOR);
		const g = c.transpose(7);
		expect(g.root.canonicalName).toBe("G");
		expect(g.formula).toBe(SCALE_FORMULAS.MAJOR);
	});

	it("re-infers preferFlats for the new root", () => {
		const c = new Scale("C", SCALE_FORMULAS.MAJOR);
		// C + 10 semitones = A#/Bb.  Pitch class 10 infers preferFlats=true.
		const bb = c.transpose(10);
		expect(bb.preferFlats).toBe(true);
	});

	it("preserves notes relationship after transposition", () => {
		const d = new Scale("D", SCALE_FORMULAS.MAJOR);
		const up = d.transpose(5); // D + 5 = G
		expect(up.root.canonicalName).toBe("G");
		const noteNames = up.notes().map((n) => n.canonicalName);
		expect(noteNames).toEqual(["G", "A", "B", "C", "D", "E", "F#"]);
	});
});

// ---------------------------------------------------------------------------
// Scale.toString()
// ---------------------------------------------------------------------------

describe("Scale.toString()", () => {
	it("uses flat name for flat roots", () => {
		expect(new Scale("Bb", SCALE_FORMULAS.MAJOR).toString()).toBe("Bb Major");
		expect(new Scale("Eb", SCALE_FORMULAS.DORIAN).toString()).toBe(
			"Eb Dorian",
		);
	});

	it("uses sharp name for sharp-context roots", () => {
		expect(new Scale("F#", SCALE_FORMULAS.MAJOR).toString()).toBe("F# Major");
		expect(new Scale("D", SCALE_FORMULAS.MIXOLYDIAN).toString()).toBe(
			"D Mixolydian",
		);
	});
});

// ---------------------------------------------------------------------------
// Scale.allPitchClassNames()
// ---------------------------------------------------------------------------

describe("Scale.allPitchClassNames()", () => {
	it("returns 12 entries", () => {
		expect(new Scale("C", SCALE_FORMULAS.MAJOR).allPitchClassNames()).toHaveLength(12);
	});

	it("uses sharp names for sharp-context scale", () => {
		const names = new Scale("G", SCALE_FORMULAS.MAJOR).allPitchClassNames();
		expect(names[1]).toBe("C#");
		expect(names[10]).toBe("A#");
	});

	it("uses flat names for flat-context scale", () => {
		const names = new Scale("Bb", SCALE_FORMULAS.MAJOR).allPitchClassNames();
		expect(names[1]).toBe("Db");
		expect(names[10]).toBe("Bb");
	});
});
