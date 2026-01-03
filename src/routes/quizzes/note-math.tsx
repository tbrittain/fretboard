import {createFileRoute} from '@tanstack/react-router'
import {useEffect, useRef, useState} from 'react'
import {Note, PITCH_CLASS_NAMES} from '@/types/Note.ts'

export const Route = createFileRoute('/quizzes/note-math')({
    component: RouteComponent,
})

function getRandomNote(): Note {
    const randomPc = PITCH_CLASS_NAMES[Math.floor(Math.random() * PITCH_CLASS_NAMES.length)]
    return new Note(randomPc)
}

function getRandomSemitoneOffset(maxRange: number): number {
    const range = maxRange * 2
    let offset = Math.floor(Math.random() * range) - maxRange
    if (offset >= 0) offset += 1
    return offset
}

function RouteComponent() {
    const [maxSemitoneRange, setMaxSemitoneRange] = useState<number>(5)
    const [semitones, setSemitones] = useState<number>(getRandomSemitoneOffset(maxSemitoneRange))
    const [currentNote, setCurrentNote] = useState(() => getRandomNote())
    const [inputValue, setInputValue] = useState('')
    const [score, setScore] = useState<{ correct: number; total: number }>({correct: 0, total: 0})
    const [feedback, setFeedback] = useState<string | null>(null)
    const [incorrects, setIncorrects] = useState<{
        note: Note;
        offset: number;
        target: Note
    }[]>([])
    const timeoutRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        }
    }, [])

    const advanceToNext = () => {
        setInputValue('')
        setFeedback(null)
        setCurrentNote(getRandomNote())
        setSemitones(getRandomSemitoneOffset(maxSemitoneRange))
    }

    const submitAnswer = (e?: React.FormEvent) => {
        e?.preventDefault()
        const trimmed = inputValue.trim()
        if (!trimmed) {
            setFeedback('Please enter a pitch-class, e.g. C, F#, Bb')
            return
        }

        try {
            const parsedNote = new Note(trimmed)
            const target = currentNote.transpose(semitones)

            if (parsedNote.equalsPitchClass(target)) {
                setFeedback(`Correct! ${target.toString().replace(/\d+$/, '')}`)
                setScore(({correct, total}) => ({correct: correct + 1, total: total + 1}))
            } else {
                setFeedback(`Incorrect — answer: ${target.toString().replace(/\d+$/, '')}`)
                setScore(({correct, total}) => ({correct, total: total + 1}))
                setIncorrects((prev) => [...prev, {
                    note: currentNote,
                    offset: semitones,
                    target: target
                }])
            }
        } catch (err) {
            setFeedback('Invalid input. Use a pitch-class like C, F#, or Bb')
            return
        }

        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => {
            advanceToNext()
        }, 2_000)
    }

    return (
        <div className="p-4 bg-white rounded shadow-md mx-10 mt-10 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-3">Transposition Quiz — apply the semitone offset</h2>

            <div className="mb-4">
                <label htmlFor="number-semitones">Max number of Semitones: </label>
                <select
                    id="number-semitones"
                    value={maxSemitoneRange}
                    onChange={(e) => {
                        setMaxSemitoneRange(parseInt(e.target.value, 10));
                        advanceToNext();
                    }}
                    className="border p-1 rounded mb-2 ml-2"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4 flex items-center space-x-6">
                <div className="text-2xl font-bold">{currentNote.canonicalName}</div>
                <div className="text-xl font-medium text-gray-600">{semitones > 0 ? `+${semitones}` : semitones}</div>

                <form onSubmit={submitAnswer}>
                    <input
                        aria-label="Type pitch-class answer"
                        maxLength={2}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border p-2 rounded mr-2"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Submit</button>
                </form>
            </div>

            {feedback && <div className="mb-2 text-sm">{feedback}</div>}

            <div className="mt-2">Score: {score.correct} / {score.total}</div>

            {incorrects.length > 0 && (
                <div className="mt-4 w-full max-w-md">
                    <h3 className="font-medium">Incorrect Attempts:</h3>
                    <ul className="list-disc pl-6">
                        {incorrects.map((n, idx) => (
                            <li key={idx}>
                                Note: {n.note.canonicalName}, Offset: {n.offset} →
                                Answer: {n.target.toString().replace(/\d+$/, '')}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
