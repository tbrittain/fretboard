import { useMemo, useState } from 'react';
import { Chord } from '../types/Chord';
import {PITCH_CLASS_NAMES, PitchClass} from "@/types/Note.ts";

const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7];

type Row = { pc: PitchClass; octave: number };

export default function ChordInspector() {
  const [rows, setRows] = useState<Row[]>([
    { pc: 'C', octave: 4 },
    { pc: 'E', octave: 4 },
    { pc: 'G', octave: 4 },
  ]);

  const addRow = () => {
    if (rows.length >= 6) return;
    setRows((r) => [...r, { pc: 'C', octave: 4 }]);
  };

  const removeRow = (index: number) => {
    setRows((r) => r.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const { chord, error } = useMemo(() => {
    try {
      const inputs = rows.map((row) => `${row.pc}${row.octave}`);
      const chord = new Chord(inputs);
      return { chord, error: null };
    } catch (err: any) {
      return { chord: null, error: err?.message ?? String(err) };
    }
  }, [rows]);

  return (
    <div className="p-4 bg-white rounded shadow-md max-w-xl">
      <h2 className="text-lg font-semibold mb-3">Chord Inspector</h2>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select
              aria-label={`pitch-class-${idx}`}
              value={row.pc}
              onChange={(e) => updateRow(idx, { pc: e.target.value as PitchClass })}
              className="border p-1 rounded"
            >
              {PITCH_CLASS_NAMES.map((pc) => (
                <option key={pc} value={pc}>
                  {pc}
                </option>
              ))}
            </select>

            <select
              aria-label={`octave-${idx}`}
              value={row.octave}
              onChange={(e) => updateRow(idx, { octave: Number(e.target.value) })}
              className="border p-1 rounded"
            >
              {OCTAVES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <button
              className="ml-auto text-sm text-red-600"
              onClick={() => removeRow(idx)}
              aria-label={`remove-${idx}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={addRow}
          disabled={rows.length >= 6}
          className="px-3 py-1 bg-cyan-600 text-white rounded disabled:opacity-50"
        >
          Add Note
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded">
        <h3 className="font-medium">Result</h3>
        {error ? (
          <div className="text-red-600 mt-2">Error: {error}</div>
        ) : chord ? (
          <div className="mt-2">
            <div className="font-semibold">Symbol: {chord.symbol() ?? '—'}</div>
            <div className="text-sm text-gray-700 mt-1">Quality: {JSON.stringify(chord.quality())}</div>
            <div className="text-sm text-gray-700 mt-1">Notes: {chord.toString()}</div>
            <div className="text-sm text-gray-700 mt-1">MIDI: {chord.toMidi().join(', ')}</div>
          </div>
        ) : (
          <div className="text-gray-700 mt-2">No chord</div>
        )}
      </div>
    </div>
  );
}

