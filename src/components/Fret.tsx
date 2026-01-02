import {GuitarNoteProps, GuitarNote} from "@/components/GuitarNote.tsx";

export type FretProps = {
    fretNumber: number;
    displayNumber?: boolean;
    notes: GuitarNoteProps[];
}

const thicknesses = [2, 2.25, 2.5, 2.75, 3, 3.5];

/**
 * Renders a guitar fret with six strings (notes).
 * @param fretNumber the fret number
 * @param displayNumber whether to display the fret number above the fret
 * @param notes an array of six GuitarNoteProps, one for each string (from 1st to 6th, 1st is thinnest)
 * @constructor
 */
function Fret({fretNumber, displayNumber = false, notes}: FretProps) {
    if (notes?.length !== 6) {
        throw new Error(`Fret component expects exactly 6 notes, but got ${notes?.length}`);
    }

    // We'll render strings top-to-bottom as typical guitar tab: top is 1st (thinnest)
    // Provide relative thickness values: top (index 0) is thinnest

    return (
        <div style={{ display: 'inline-block', padding: 8 }}>
            {displayNumber ? (
                <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 12, color: '#444' }}>{fretNumber}</div>
            ) : null}

            <div style={{ position: 'relative', padding: '6px 12px', borderLeft: '2px solid #bbb', borderRight: '2px solid #bbb', display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
                {notes.map((noteProps, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GuitarNote {...noteProps} stringThickness={thicknesses[idx] ?? 2} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Fret;