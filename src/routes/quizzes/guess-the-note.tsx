import {createFileRoute} from '@tanstack/react-router'
import GuitarNeck from "@/components/GuitarNeck.tsx";
import {useState} from "react";
import {GuitarNeckEStandardTuning, StringNote} from "@/types/GuitarNeckEStandardTuning.ts";
import {PITCH_CLASS_NAMES, PitchClass} from "@/types/Note.ts";

export const Route = createFileRoute('/quizzes/guess-the-note')({
    component: RouteComponent,
})

const STARTS_AT_FRET = 0
const NUMBER_OF_FRETS = 3

function getRandomNote(numberOfFrets: number): StringNote {
    const stringIndex = Math.floor(Math.random() * 6);
    const fretNumber = Math.floor(Math.random() * numberOfFrets) + STARTS_AT_FRET;

    const note = GuitarNeckEStandardTuning[stringIndex][fretNumber];
    return { stringIndex, note };
}

function RouteComponent() {
    const [selectedNumberOfFrets, setSelectedNumberOfFrets] = useState<number>(NUMBER_OF_FRETS);
    const [selectedNotes, setSelectedNotes] = useState<StringNote[]>([getRandomNote(selectedNumberOfFrets)])
    const [selectedOption, setSelectedOption] = useState<PitchClass>('C');

    return (
        <div>
            <label htmlFor="number-of-frets">Number of Frets: </label>
            <select
                id="number-of-frets"
                value={selectedNumberOfFrets}
                onChange={(e) => {
                    const numFrets = parseInt(e.target.value, 10);
                    setSelectedNumberOfFrets(numFrets);
                    // reset the note
                    setSelectedNotes([getRandomNote(selectedNumberOfFrets)]);
                }}
                className="border p-1 rounded mb-4"
            >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                        {num}
                    </option>
                ))}
            </select>

            <GuitarNeck
                selectedNotes={selectedNotes}
                setSelectedNotes={setSelectedNotes}
                startsAtFret={STARTS_AT_FRET}
                numberOfFrets={selectedNumberOfFrets}
                displayNoteLabels={false}
            />

            <select
                aria-label={`pitch-class`}
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value as PitchClass)}
                className="border p-1 rounded"
            >
                {PITCH_CLASS_NAMES.map((pc) => (
                    <option key={pc} value={pc}>
                        {pc}
                    </option>
                ))}
            </select>
            <button
                onClick={() => {
                    const currentNote = selectedNotes[0].note;
                    if (currentNote.canonicalName === selectedOption) {
                        alert(`Correct! The note is ${currentNote.toString()}`);
                    } else {
                        alert(`Incorrect. The note is ${currentNote.toString()}`);
                    }
                    setSelectedNotes([getRandomNote(selectedNumberOfFrets)]);
                    setSelectedOption('C');
                }}
                className="ml-2 p-1 bg-blue-500 text-white rounded"
            >
                Submit
            </button>
        </div>
    )
}
