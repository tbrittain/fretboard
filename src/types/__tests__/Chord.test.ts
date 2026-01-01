import { describe, it, expect } from 'vitest';
import { Note } from '../Note';
import { Chord } from '../Chord';

describe('Chord', () => {
	it('constructs from mixed inputs and sorts by midi by default', () => {
		const c = new Chord([new Note('E4'), 'C4', 67]);
		expect(c.toString()).toBe('C (C4 E4 G4)');
		expect(c.toMidi()).toEqual([60, 64, 67]);
	});

	it('respects preserveVoicing when true', () => {
		const c = new Chord(['E4', 'C4', 'G4'], true);
		expect(c.toString()).toBe('C (E4 C4 G4)');
	});

	it('transposes correctly', () => {
		const c = new Chord(['C4', 'E4', 'G4']);
		const up = c.transpose(12);
		expect(up.toMidi()).toEqual([72, 76, 79]);
	});

	it('intervalsFromRoot returns semitone intervals from chosen root', () => {
		const c = new Chord(['C4', 'E4', 'G4']);
		expect(c.intervalsFromRoot(0)).toEqual([0, 4, 7]);
	});

	it('contains and equals behave as expected with enharmonics', () => {
		const c = new Chord(['C#4', 'E4', 'G4']);
		expect(c.contains('Db4')).toBe(true);
		const d = new Chord(['Db4', 'E4', 'G4']);
		expect(c.equals(d)).toBe(true);
	});

	it('withAdded and without work and respect 6-note limit', () => {
		let c = new Chord(['C4', 'E4', 'G4']);
		c = c.withAdded('B4');
		expect(c.size).toBe(4);
		c = c.without('E4');
		expect(c.contains('E4')).toBe(false);

		// build a 6-note chord then adding should throw
		let hex = new Chord(['C4', 'D4', 'E4', 'F4', 'G4', 'A4']);
		expect(() => hex.withAdded('B4')).toThrow();
	});

	it('throws for too many notes in constructor', () => {
		expect(() => new Chord(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'])).toThrow();
	});

	it('detects chord quality for common types and handles inversions', () => {
		expect(new Chord(['C4', 'E4', 'G4']).quality()).toEqual({ root: 'C', type: 'maj' });
		expect(new Chord(['A3', 'C4', 'E4']).quality()).toEqual({ root: 'A', type: 'm' });
		expect(new Chord(['C4', 'E4', 'G#4']).quality()).toEqual({ root: 'C', type: 'aug' });
		expect(new Chord(['B3', 'D4', 'F4']).quality()).toEqual({ root: 'B', type: 'dim' });
		expect(new Chord(['C4', 'D4', 'G4']).quality()).toEqual({ root: 'C', type: 'sus2' });
		expect(new Chord(['C4', 'F4', 'G4']).quality()).toEqual({ root: 'C', type: 'sus4' });

		expect(new Chord(['C4', 'E4', 'G4', 'B4']).quality()).toEqual({ root: 'C', type: 'maj7' });
		expect(new Chord(['C4', 'E4', 'G4', 'Bb4']).quality()).toEqual({ root: 'C', type: '7' });
		expect(new Chord(['A3', 'C4', 'E4', 'G4']).quality()).toEqual({ root: 'A', type: 'm7' });
		expect(new Chord(['B3', 'D4', 'F4', 'A4']).quality()).toEqual({ root: 'B', type: 'm7b5' });
		expect(new Chord(['C4', 'Eb4', 'Gb4', 'A4']).quality()).toEqual({ root: 'C', type: 'dim7' });

		// inversion: E4 C4 G4 => still C major
		expect(new Chord(['E4', 'C4', 'G4']).quality()).toEqual({ root: 'C', type: 'maj' });
	});
});

