import {Note} from "@/types/Note.ts";

const lowE = new Note('E2');
const A = new Note('A2');
const D = new Note('D3');
const G = new Note('G3');
const B = new Note('B3');
const highE = new Note('E4');

// for each of the above notes, we'll transpose up 22 semitones to get all frets

const NUM_FRETS = 22;

function generateStringNotes(openNote: Note): Note[] {
    return Array.from({length: NUM_FRETS + 1}, (_, fret) => openNote.transpose(fret));
}

/**
 * Represents the notes on a guitar neck in E standard tuning. Contains 6 strings,
 * each with notes from open string (fret 0) to fret 22. The 0th index is the 1st string (high E),
 * and the 5th index is the 6th string (low E).
 */
export const GuitarNeckEStandardTuning: Note[][] = [
    generateStringNotes(highE), // 1st string
    generateStringNotes(B),     // 2nd string
    generateStringNotes(G),     // 3rd string
    generateStringNotes(D),     // 4th string
    generateStringNotes(A),     // 5th string
    generateStringNotes(lowE),  // 6th string
];