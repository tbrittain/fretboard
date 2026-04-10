<script lang="ts">
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "svelte-konva";
import {
	getEStandardFretNotes,
	type StringNote,
} from "$types/GuitarNeckEStandardTuning";

type Props = {
	selectedNotes?: StringNote[];
	mutedStrings?: number[];
	onNoteClick?: (note: StringNote) => void;
	startsAtFret?: number;
	numberOfFrets?: number;
	displayNoteLabels?: boolean;
};

let {
	selectedNotes = [],
	mutedStrings = [],
	onNoteClick,
	startsAtFret = 0,
	numberOfFrets = 12,
	displayNoteLabels = true,
}: Props = $props();

// Layout constants
const FRET_WIDTH = 72;
const STRING_SPACING = 32;
const STRING_COUNT = 6;
const PAD_H = 46;
const PAD_V = 28;
const NOTE_RADIUS = 13;
const FRET_OVERHANG = 8; // how far fret wires extend above/below outermost strings

const NECK_HEIGHT = PAD_V * 2 + STRING_SPACING * (STRING_COUNT - 1);
const STRING_INDICES = [0, 1, 2, 3, 4, 5];

// Fret position markers
const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_DOT_FRETS = new Set([12, 24]);
const LABEL_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21]);

// String visual properties (index 0 = high E, index 5 = low E)
const STRING_COLORS = [
	"#D8D8D8",
	"#C8C8C8",
	"#B4B4B4",
	"#C8A040",
	"#B89030",
	"#A88020",
];
const STRING_WIDTHS = [1.0, 1.3, 1.8, 2.4, 3.0, 3.6];

// When startsAtFret === 0, fret cells represent frets 1–N (open strings get their own zone).
// Otherwise fret cells represent startsAtFret–(startsAtFret+N-1).
let effectiveStartFret = $derived(startsAtFret === 0 ? 1 : startsAtFret);

let neckWidth = $derived(PAD_H * 2 + FRET_WIDTH * numberOfFrets);
let fretIndices = $derived(Array.from({ length: numberOfFrets }, (_, i) => i));

// x center of the open-string circles, sitting 6px clear of the nut's left edge.
// PAD_H=46 ensures the circle (radius 13) has ~8px margin from the canvas left edge.
const OPEN_STRING_X = PAD_H - 6 - NOTE_RADIUS - 6; // = 21

function stringY(s: number): number {
	return PAD_V + s * STRING_SPACING;
}

function noteCenterX(fretIndex: number): number {
	return PAD_H + fretIndex * FRET_WIDTH + FRET_WIDTH / 2;
}

function fretWireX(index: number): number {
	return PAD_H + (index + 1) * FRET_WIDTH;
}

// Fretted note for a given cell (uses effectiveStartFret so fretIndex 0 = first real fret).
function getNote(
	stringIndex: number,
	fretIndex: number,
): StringNote | undefined {
	const fretNumber = effectiveStartFret + fretIndex;
	return getEStandardFretNotes(fretNumber).find(
		(n) => n.stringIndex === stringIndex,
	);
}

function isSelected(stringIndex: number, fretIndex: number): boolean {
	const note = getNote(stringIndex, fretIndex);
	if (!note) return false;
	return selectedNotes.some(
		(s) => s.stringIndex === stringIndex && s.note.equalsEnharmonic(note.note),
	);
}

function handleClick(stringIndex: number, fretIndex: number) {
	const note = getNote(stringIndex, fretIndex);
	if (note) onNoteClick?.(note);
}

// Open-string helpers (fret 0, only relevant when startsAtFret === 0).
function getOpenNote(stringIndex: number): StringNote | undefined {
	return getEStandardFretNotes(0).find((n) => n.stringIndex === stringIndex);
}

function isOpenSelected(stringIndex: number): boolean {
	const note = getOpenNote(stringIndex);
	if (!note) return false;
	return selectedNotes.some(
		(s) => s.stringIndex === stringIndex && s.note.equalsEnharmonic(note.note),
	);
}

function handleOpenClick(stringIndex: number) {
	const note = getOpenNote(stringIndex);
	if (note) onNoteClick?.(note);
}
</script>

<div class="neck-wrapper">
	<Stage width={neckWidth} height={NECK_HEIGHT}>
		<Layer>
			<!-- Fretboard body -->
			<Rect
				x={0}
				y={0}
				width={neckWidth}
				height={NECK_HEIGHT}
				fill="#2D1508"
				cornerRadius={4}
			/>

			<!-- Open string hit areas + circles (startsAtFret === 0 only).
			     Rendered before the nut so the nut paints on top if needed,
			     but circles are positioned cleanly to the LEFT of the nut. -->
			{#if startsAtFret === 0}
				{#each STRING_INDICES as stringIndex}
					{@const openSelected = isOpenSelected(stringIndex)}
					{@const openNote = openSelected ? getOpenNote(stringIndex) : undefined}

					<Group
						x={OPEN_STRING_X}
						y={stringY(stringIndex)}
						onclick={() => handleOpenClick(stringIndex)}
					>
						<!-- Hit area centred on the open-string circle -->
						<Rect
							x={-NOTE_RADIUS - 2}
							y={-STRING_SPACING / 2}
							width={NOTE_RADIUS * 2 + 4}
							height={STRING_SPACING}
							fill="rgba(0,0,0,0.001)"
						/>
						{#if openSelected}
							<Circle
								radius={NOTE_RADIUS}
								fill="#2563EB"
								stroke="#BFDBFE"
								strokeWidth={1.5}
								shadowColor="#2563EB"
								shadowBlur={8}
								shadowOpacity={0.6}
							/>
							{#if displayNoteLabels && openNote}
								<Text
									x={-NOTE_RADIUS}
									y={-NOTE_RADIUS}
									width={NOTE_RADIUS * 2}
									height={NOTE_RADIUS * 2}
									text={openNote.note.canonicalName}
									fontSize={10}
									fontStyle="bold"
									fill="#FFFFFF"
									fontFamily="Ubuntu, sans-serif"
									align="center"
									verticalAlign="middle"
								/>
							{/if}
						{/if}
					</Group>
				{/each}
			{/if}

			<!-- Muted string X markers — always shown in the pre-nut zone regardless of startsAtFret -->
			{#each STRING_INDICES as stringIndex}
				{#if mutedStrings.includes(stringIndex)}
					<Group x={OPEN_STRING_X} y={stringY(stringIndex)}>
						<Line
							points={[-9, -9, 9, 9]}
							stroke="#EF4444"
							strokeWidth={2.5}
							lineCap="round"
						/>
						<Line
							points={[9, -9, -9, 9]}
							stroke="#EF4444"
							strokeWidth={2.5}
							lineCap="round"
						/>
					</Group>
				{/if}
			{/each}

			<!-- Nut (thick bar, only when startsAtFret === 0) -->
			{#if startsAtFret === 0}
				<Rect
					x={PAD_H - 6}
					y={PAD_V - FRET_OVERHANG}
					width={7}
					height={STRING_SPACING * 5 + FRET_OVERHANG * 2}
					fill="#F0E0B0"
					cornerRadius={1}
				/>
			{/if}

			<!-- Fret wires -->
			{#each fretIndices as i}
				<Line
					points={[fretWireX(i), PAD_V - FRET_OVERHANG, fretWireX(i), NECK_HEIGHT - PAD_V + FRET_OVERHANG]}
					stroke="#7A6040"
					strokeWidth={1.5}
				/>
			{/each}

			<!-- Strings -->
			{#each STRING_INDICES as s}
				<Line
					points={[PAD_H, stringY(s), neckWidth - PAD_H, stringY(s)]}
					stroke={STRING_COLORS[s]}
					strokeWidth={STRING_WIDTHS[s]}
					shadowColor={STRING_COLORS[s]}
					shadowBlur={3}
					shadowOpacity={0.5}
				/>
			{/each}

			<!-- Position marker dots -->
			{#each fretIndices as i}
				{@const fn = effectiveStartFret + i}
				{#if SINGLE_DOT_FRETS.has(fn)}
					<Circle
						x={noteCenterX(i)}
						y={PAD_V + STRING_SPACING * 2.5}
						radius={5}
						fill="#E8C84A"
						opacity={0.45}
					/>
				{:else if DOUBLE_DOT_FRETS.has(fn)}
					<Circle
						x={noteCenterX(i)}
						y={PAD_V + STRING_SPACING * 1.5}
						radius={5}
						fill="#E8C84A"
						opacity={0.45}
					/>
					<Circle
						x={noteCenterX(i)}
						y={PAD_V + STRING_SPACING * 3.5}
						radius={5}
						fill="#E8C84A"
						opacity={0.45}
					/>
				{/if}
			{/each}

			<!-- Fret number labels -->
			{#each fretIndices as i}
				{@const fn = effectiveStartFret + i}
				{#if i === 0 || LABEL_FRETS.has(fn)}
					<Text
						x={noteCenterX(i) - 14}
						y={NECK_HEIGHT - PAD_V + 10}
						width={28}
						align="center"
						text={String(fn)}
						fontSize={11}
						fill="#8A7050"
						fontFamily="Ubuntu, sans-serif"
					/>
				{/if}
			{/each}

			<!-- Fretted note hit areas and markers -->
			{#each fretIndices as fretIndex}
				{#each STRING_INDICES as stringIndex}
					{@const selected = isSelected(stringIndex, fretIndex)}
					{@const noteData = selected ? getNote(stringIndex, fretIndex) : undefined}

					<Group
						x={noteCenterX(fretIndex)}
						y={stringY(stringIndex)}
						onclick={() => handleClick(stringIndex, fretIndex)}
					>
						<!-- Transparent hit area covering the full cell -->
						<Rect
							x={-FRET_WIDTH / 2}
							y={-STRING_SPACING / 2}
							width={FRET_WIDTH}
							height={STRING_SPACING}
							fill="rgba(0,0,0,0.001)"
						/>

						{#if selected}
							<Circle
								radius={NOTE_RADIUS}
								fill="#2563EB"
								stroke="#BFDBFE"
								strokeWidth={1.5}
								shadowColor="#2563EB"
								shadowBlur={8}
								shadowOpacity={0.6}
							/>
							{#if displayNoteLabels && noteData}
								<Text
									x={-NOTE_RADIUS}
									y={-NOTE_RADIUS}
									width={NOTE_RADIUS * 2}
									height={NOTE_RADIUS * 2}
									text={noteData.note.canonicalName}
									fontSize={10}
									fontStyle="bold"
									fill="#FFFFFF"
									fontFamily="Ubuntu, sans-serif"
									align="center"
									verticalAlign="middle"
								/>
							{/if}
						{/if}
					</Group>
				{/each}
			{/each}
		</Layer>
	</Stage>
</div>

<style>
	.neck-wrapper {
		overflow-x: auto;
		max-width: 100%;
		display: inline-block;
	}
</style>
