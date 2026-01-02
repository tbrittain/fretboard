import {createFileRoute} from '@tanstack/react-router'
import GuitarNeck from "@/components/GuitarNeck.tsx";
import {useState} from "react";
import {GuitarNeckEStandardTuning, StringNote} from "@/types/GuitarNeckEStandardTuning.ts";
import {PITCH_CLASS_NAMES} from "@/types/Note.ts";

export const Route = createFileRoute('/quizzes/guess-the-note')({
    component: RouteComponent,
})

const STARTS_AT_FRET = 0
const NUMBER_OF_FRETS = 3

function getRandomNote(numberOfFrets: number, startFret: number): StringNote {
    const stringIndex = Math.floor(Math.random() * 6);
    const fretNumber = Math.floor(Math.random() * numberOfFrets) + startFret;

    const note = GuitarNeckEStandardTuning[stringIndex][fretNumber];
    return {stringIndex, note};
}

function RouteComponent() {
    const [selectedStartFret, setSelectedStartFret] = useState<number>(STARTS_AT_FRET);
    const [selectedNumberOfFrets, setSelectedNumberOfFrets] = useState<number>(NUMBER_OF_FRETS);
    const [selectedNotes, setSelectedNotes] = useState<StringNote[]>([getRandomNote(selectedNumberOfFrets, selectedStartFret)])
    const [score, setScore] = useState<{ correct: number; total: number }>({correct: 0, total: 0});
    const [incorrectNotes, setIncorrectNotes] = useState<StringNote[]>([]);

    return (
        <div className="p-4 bg-white rounded shadow-md mx-10 mt-10 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-3">Guess the Note Quiz</h2>

            <div>
                <div>
                    <label htmlFor="number-of-frets">Number of Frets: </label>
                    <select
                        id="number-of-frets"
                        value={selectedNumberOfFrets}
                        onChange={(e) => {
                            const numFrets = parseInt(e.target.value, 10);
                            setSelectedNumberOfFrets(numFrets);
                            // reset the note
                            setSelectedNotes([getRandomNote(selectedNumberOfFrets, selectedStartFret)]);
                        }}
                        className="border p-1 rounded mb-4"
                    >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>
                                {num}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="starting-fret">Starting fret: </label>
                    <select
                        id="starting-fret"
                        value={selectedStartFret}
                        onChange={(e) => {
                            const startFret = parseInt(e.target.value, 10);
                            setSelectedStartFret(startFret);
                            // reset the note
                            setSelectedNotes([getRandomNote(selectedNumberOfFrets, selectedStartFret)]);
                        }}
                        className="border p-1 rounded mb-4"
                    >
                        {[0, 1, 2, 3].map((num) => (
                            <option key={num} value={num}>
                                {num}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <GuitarNeck
                selectedNotes={selectedNotes}
                setSelectedNotes={setSelectedNotes}
                startsAtFret={selectedStartFret}
                numberOfFrets={selectedNumberOfFrets}
                displayNoteLabels={false}
            />

            <div>
                {PITCH_CLASS_NAMES.map((pc) => (
                    <button
                        key={pc}
                        onClick={() => {
                            const currentNote = selectedNotes[0].note;
                            if (currentNote.canonicalName === pc) {
                                alert(`Correct! The note is ${currentNote.toString()}`);
                                setScore(({correct, total}) => ({correct: correct + 1, total: total + 1}));
                            } else {
                                alert(`Incorrect. The note is ${currentNote.toString()}`);
                                setScore(({correct, total}) => ({correct, total: total + 1}));
                                setIncorrectNotes((prev) => [...prev, selectedNotes[0]]);
                            }
                            setSelectedNotes([getRandomNote(selectedNumberOfFrets, selectedStartFret)]);
                        }}
                        className="m-1 p-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        {pc}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                Score: {score.correct} / {score.total}
            </div>

            {incorrectNotes.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-medium">Incorrect Notes:</h3>
                    <ul>
                        {incorrectNotes.map((note, index) => (
                            <li key={index}>
                                String {note.stringIndex + 1}, Note: {note.note.toString()}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
