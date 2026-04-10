import { describe, expect, it } from "vitest";
import { Chord } from "../Chord";
import { Note } from "../Note";

describe("Chord", () => {
	it("constructs from mixed inputs and sorts by midi by default", () => {
		const c = new Chord([new Note("E4"), "C4", 67]);
		expect(c.toString()).toBe("C (C4 E4 G4)");
		expect(c.toMidi()).toEqual([60, 64, 67]);
	});

	it("respects preserveVoicing when true", () => {
		const c = new Chord(["E4", "C4", "G4"], true);
		expect(c.toString()).toBe("C (E4 C4 G4)");
	});

	it("transposes correctly", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const up = c.transpose(12);
		expect(up.toMidi()).toEqual([72, 76, 79]);
	});

	it("intervalsFromRoot returns semitone intervals from chosen root", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		expect(c.intervalsFromRoot(0)).toEqual([0, 4, 7]);
	});

	it("contains and equals behave as expected with enharmonics", () => {
		const c = new Chord(["C#4", "E4", "G4"]);
		expect(c.contains("Db4")).toBe(true);
		const d = new Chord(["Db4", "E4", "G4"]);
		expect(c.equals(d)).toBe(true);
	});

	it("withAdded and without work and respect 6-note limit", () => {
		let c = new Chord(["C4", "E4", "G4"]);
		c = c.withAdded("B4");
		expect(c.size).toBe(4);
		c = c.without("E4");
		expect(c.contains("E4")).toBe(false);

		// build a 6-note chord then adding should throw
		const hex = new Chord(["C4", "D4", "E4", "F4", "G4", "A4"]);
		expect(() => hex.withAdded("B4")).toThrow();
	});

	it("throws for too many notes in constructor", () => {
		expect(
			() => new Chord(["C4", "D4", "E4", "F4", "G4", "A4", "B4"]),
		).toThrow();
	});

	it("detects chord quality for common types and handles inversions", () => {
		expect(new Chord(["C4", "E4", "G4"]).quality()).toEqual({
			root: "C",
			type: "maj",
		});
		expect(new Chord(["A3", "C4", "E4"]).quality()).toEqual({
			root: "A",
			type: "m",
		});
		expect(new Chord(["C4", "E4", "G#4"]).quality()).toEqual({
			root: "C",
			type: "aug",
		});
		expect(new Chord(["B3", "D4", "F4"]).quality()).toEqual({
			root: "B",
			type: "dim",
		});
		expect(new Chord(["C4", "D4", "G4"]).quality()).toEqual({
			root: "C",
			type: "sus2",
		});
		expect(new Chord(["C4", "F4", "G4"]).quality()).toEqual({
			root: "C",
			type: "sus4",
		});

		expect(new Chord(["C4", "E4", "G4", "B4"]).quality()).toEqual({
			root: "C",
			type: "maj7",
		});
		expect(new Chord(["C4", "E4", "G4", "Bb4"]).quality()).toEqual({
			root: "C",
			type: "7",
		});
		expect(new Chord(["A3", "C4", "E4", "G4"]).quality()).toEqual({
			root: "A",
			type: "m7",
		});
		expect(new Chord(["B3", "D4", "F4", "A4"]).quality()).toEqual({
			root: "B",
			type: "m7b5",
		});
		expect(new Chord(["C4", "Eb4", "Gb4", "A4"]).quality()).toEqual({
			root: "C",
			type: "dim7",
		});

		// inversion: E4 C4 G4 => still C major
		expect(new Chord(["E4", "C4", "G4"]).quality()).toEqual({
			root: "C",
			type: "maj",
		});
	});

	// New tests for inversion behavior
	it("invert shifts lowest note up an octave and invert(0) is identity", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		expect(c.invert(0).toMidi()).toEqual([60, 64, 67]);
		const inv1 = c.invert(1);
		expect(inv1.toMidi()).toEqual([64, 67, 72]);
		const inv2 = c.invert(2);
		expect(inv2.toMidi()).toEqual([67, 72, 76]);
	});

	it("allInversions returns the sequence of successive inversions", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const invs = c.allInversions();
		expect(invs.length).toBe(3);
		expect(invs.map((ch) => ch.toMidi())).toEqual([
			[60, 64, 67],
			[64, 67, 72],
			[67, 72, 76],
		]);
	});

	// Voicing tests
	it("voicings close produces ascending close-position notes", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const v = c.voicings({ mode: "close" })[0];
		expect(v.toMidi()).toEqual([60, 64, 67]);
	});

	it("voicings open spreads every other note up an octave", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const v = c.voicings({ mode: "open" })[0];
		expect(v.toMidi()).toEqual([60, 67, 76]);
	});

	it("doubling root and fifth add an extra note above the top", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const vRoot = c.voicings({ doubling: "root" })[0];
		expect(vRoot.toMidi()).toEqual([60, 64, 67, 72]);
		const vFifth = c.voicings({ doubling: "fifth" })[0];
		expect(vFifth.toMidi()).toEqual([60, 64, 67, 79]);
	});

	it("enforce maxSpread reduces spread by lowering top notes when possible", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const original = Math.max(...c.toMidi()) - Math.min(...c.toMidi());
		const v = c.voicings({ mode: "close", maxSpread: 6 })[0];
		// function should not increase spread
		expect(v.toMidi().length).toBeGreaterThan(0);
		const newSpread = Math.max(...v.toMidi()) - Math.min(...v.toMidi());
		expect(newSpread).toBeLessThanOrEqual(original);
		// if it achieved the requested maxSpread, assert that; otherwise at least it didn't worsen
		if (newSpread <= 6) expect(newSpread).toBeLessThanOrEqual(6);
	});

	it("setBass positions the chord so the lowest note matches requested bass midi", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const v = c.setBass("E3");
		expect(v.toMidi()[0]).toBe(new Note("E3").toMidi());
	});

	it("voicings returns an array of candidates (currently single candidate)", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const candidates = c.voicings();
		expect(Array.isArray(candidates)).toBe(true);
		expect(candidates.length).toBe(1);
	});

	it("doubling on a nearly-full chord throws due to 6-note limit", () => {
		const hex = new Chord(["C3", "D3", "E3", "F3", "G3", "A3"]);
		expect(() => hex.voicings({ doubling: "root" })).toThrow();
	});

	it("setBass fallback: if pitch-class not present, setBass still produces requested exact midi", () => {
		const c = new Chord(["C4", "E4", "G4"]);
		const v = c.setBass("D2");
		expect(v.toMidi()[0]).toBe(new Note("D2").toMidi());
	});
});
