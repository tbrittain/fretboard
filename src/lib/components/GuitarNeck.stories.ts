import type { Meta, StoryObj } from '@storybook/sveltekit';
import { getEStandardFretNotes } from '$types/GuitarNeckEStandardTuning';
import GuitarNeck from './GuitarNeck.svelte';

const meta = {
	title: 'Components/GuitarNeck',
	component: GuitarNeck,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		numberOfFrets: { control: { type: 'range', min: 4, max: 22, step: 1 } },
		startsAtFret: { control: { type: 'range', min: 0, max: 18, step: 1 } },
		displayNoteLabels: { control: 'boolean' },
	},
} satisfies Meta<typeof GuitarNeck>;

export default meta;
type Story = StoryObj<typeof meta>;

// Open C major: E4, C4, G3, E3, C3 (low E string not played)
const openCChord = [
	getEStandardFretNotes(0).find((n) => n.stringIndex === 0)!, // E4 - high E open
	getEStandardFretNotes(1).find((n) => n.stringIndex === 1)!, // C4 - B fret 1
	getEStandardFretNotes(0).find((n) => n.stringIndex === 2)!, // G3 - G open
	getEStandardFretNotes(2).find((n) => n.stringIndex === 3)!, // E3 - D fret 2
	getEStandardFretNotes(3).find((n) => n.stringIndex === 4)!, // C3 - A fret 3
];

// A major barre chord at fret 5 (E shape)
const aMajorBarre = [
	getEStandardFretNotes(5).find((n) => n.stringIndex === 5)!, // A2 - low E fret 5
	getEStandardFretNotes(7).find((n) => n.stringIndex === 4)!, // E3 - A fret 7
	getEStandardFretNotes(7).find((n) => n.stringIndex === 3)!, // A3 - D fret 7
	getEStandardFretNotes(6).find((n) => n.stringIndex === 2)!, // C#4 - G fret 6
	getEStandardFretNotes(5).find((n) => n.stringIndex === 1)!, // E4 - B fret 5 (barre)
	getEStandardFretNotes(5).find((n) => n.stringIndex === 0)!, // A4 - high E fret 5
];

export const Default: Story = {};

export const OpenCChord: Story = {
	name: 'Open C Major Chord',
	args: {
		selectedNotes: openCChord,
		mutedStrings: [5], // low E string is not played
	},
};

export const BarreChord: Story = {
	name: 'A Major Barre Chord (Fret 5)',
	args: {
		selectedNotes: aMajorBarre,
		startsAtFret: 4,
		numberOfFrets: 8,
	},
};

export const HideNoteLabels: Story = {
	name: 'Hide Note Labels',
	args: {
		selectedNotes: openCChord,
		mutedStrings: [5],
		displayNoteLabels: false,
	},
};

export const ExtendedRange: Story = {
	name: 'Extended Fret Range',
	args: {
		numberOfFrets: 22,
	},
};
