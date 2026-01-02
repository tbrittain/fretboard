import Fret from "@/components/Fret.tsx";
import {getEStandardFretNotes, StringNote} from "@/types/GuitarNeckEStandardTuning.ts";

export type GuitarNeckProps = {
    selectedNotes: StringNote[];
    setSelectedNotes: (notes: StringNote[] | ((prev: StringNote[]) => StringNote[])) => void;
    startsAtFret?: number;
    numberOfFrets?: number;
    displayNoteLabels?: boolean;
}

const fretNumbersToShow = new Set<number>([3, 5, 7, 9, 12, 15, 17, 19, 21]);

/*function tryGetChord(notes: StringNote[]): Chord | null {
    try {
        const noteStrings = notes.map(n => n.note.toString());
        return new Chord(noteStrings);
    } catch {
        return null;
    }
}*/

function GuitarNeck({
                        selectedNotes,
                        setSelectedNotes,
                        startsAtFret = 0,
                        numberOfFrets = 12,
                        displayNoteLabels = true
                    }: GuitarNeckProps) {
    if (startsAtFret < 0 || startsAtFret > 22) {
        throw new Error(`startsAtFret must be between 0 and 22, but got ${startsAtFret}`);
    }
    if (numberOfFrets < 1 || startsAtFret + numberOfFrets > 23) {
        throw new Error(`numberOfFrets must be at least 1 and cannot exceed the maximum fret number of 22, but got ${numberOfFrets} starting at fret ${startsAtFret}`);
    }

    const fretNumbers = Array.from({length: numberOfFrets}, (_, i) => startsAtFret + i);

    return (
        <div>
            <div>
                {fretNumbers.map((fretNumber) => {
                    const notes = getEStandardFretNotes(fretNumber)
                    return <Fret
                        fretNumber={fretNumber}
                        displayNumber={fretNumber === 0 || fretNumbersToShow.has(fretNumber)}
                        notes={notes.map(note => {
                            return {
                                note: note.note,
                                displayNoteWhenSelected: displayNoteLabels,
                                isSelected: selectedNotes?.some(selected => selected.stringIndex === note.stringIndex && selected.note.equalsEnharmonic(note.note)) ?? false,
                                onClick: () => {
                                    // TODO: may want a controlled mode
                                    setSelectedNotes((prev) => {
                                        const exists = prev?.some(selected => selected.stringIndex === note.stringIndex && selected.note.equalsEnharmonic(note.note));
                                        if (exists) {
                                            // remove it
                                            return prev?.filter(selected => !(selected.stringIndex === note.stringIndex && selected.note.equalsEnharmonic(note.note)));
                                        } else {
                                            // add it
                                            return [...(prev ?? []), note];
                                        }
                                    });
                                }
                            }
                        })}/>
                })}
            </div>
            {/*Chord: {selectedNotes ? tryGetChord(selectedNotes)?.toString() ?? 'N/A' : 'N/A'}*/}
        </div>
    )
}

export default GuitarNeck;