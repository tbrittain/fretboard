import {Note} from "@/types/Note.ts";

export type GuitarNoteProps = {
    note: Note
    onClick?: () => void
    isSelected?: boolean
}

export function GuitarNote({note, onClick, isSelected = false}: GuitarNoteProps) {
    // derive a short label for the note (strip octave digits if present)
    const full = note?.toString() ?? '';
    const label = full.replace(/\d+$/g, '');

    // accessibility: allow keyboard activation when clickable
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            tabIndex={onClick ? 0 : undefined}
            role={onClick ? 'button' : undefined}
            style={{
                position: 'relative',
                width: 64,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: onClick ? 'pointer' : 'default',
            }}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            aria-pressed={isSelected ? 'true' : undefined}
        >
            {/* string line */}
            <div aria-hidden
                 style={{position: 'absolute', left: 8, right: 8, height: 2, background: '#cfcfcf', borderRadius: 2}}/>

            {/* when selected, render circular badge centered over the string */}
            {isSelected ? (
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        minWidth: 28,
                        height: 28,
                        padding: '0 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 9999,
                        border: '2px solid #444',
                        background: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        boxShadow: '0 1px 0 rgba(0,0,0,0.06)'
                    }}
                >
                    {label}
                </div>
            ) : null}
        </div>
    );
}