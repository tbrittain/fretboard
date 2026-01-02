import {GuitarNoteProps} from "@/components/GuitarNote.tsx";

export type FretProps = {
    notes: GuitarNoteProps[];
}

function Fret({notes}: FretProps) {
    if (notes?.length !== 6) {
        throw new Error(`Fret component expects exactly 6 notes, but got ${notes.length}`);
    }

    return (
        <div>
            Fret Component
        </div>
    )
}

export default Fret;