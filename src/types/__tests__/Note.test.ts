import { describe, expect, it } from "vitest";
import { Note } from "../Note";

describe("Note", () => {
	it("parses natural notes without octave using default octave", () => {
		const n = new Note("C");
		expect(n.toString()).toBe("C4");
		expect(n.toMidi()).toBe(60);
	});

	it("parses sharps and flats and normalizes to canonical sharp name", () => {
		expect(new Note("C#4").toString()).toBe("C#4");
		expect(new Note("Db4").toString()).toBe("C#4");
		expect(new Note("Bb3").toString()).toBe("A#3");
	});

	it("handles B# and Cb octave adjustments", () => {
		expect(new Note("B#3").toString()).toBe("C4");
		expect(new Note("Cb4").toString()).toBe("B3");
	});

	it("transposes correctly across octaves", () => {
		const c4 = new Note("C4");
		const up12 = c4.transpose(12);
		expect(up12.toString()).toBe("C5");
		expect(up12.toMidi()).toBe(c4.toMidi() + 12);
		const down1 = c4.transpose(-1);
		expect(down1.toString()).toBe("B3");
	});

	it("computes interval in semitones", () => {
		const a4 = new Note("A4");
		const c5 = new Note("C5");
		expect(a4.intervalTo(c5)).toBe(3); // A4(69) -> C5(72) = 3 semitones
	});

	it("equalsEnharmonic returns true for enharmonic equivalents", () => {
		expect(new Note("C#4").equalsEnharmonic(new Note("Db4"))).toBe(true);
		expect(new Note("B#3").equalsEnharmonic(new Note("C4"))).toBe(true);
	});

	it("equalsPitchClass returns true for the same note, regardless of octave", () => {
		expect(new Note("C4").equalsPitchClass(new Note("C5"))).toBe(true);
		expect(new Note("D#3").equalsPitchClass(new Note("Eb6"))).toBe(true);
		expect(new Note("F4").equalsPitchClass(new Note("F#4"))).toBe(false);
	});

	it("throws on invalid input", () => {
		expect(() => new Note("H4" as unknown as string)).toThrow();
		expect(() => new Note("C##4" as unknown as string)).toThrow();
	});
});
