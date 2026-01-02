import type { Meta, StoryObj } from '@storybook/react-vite';
import Fret from "@/components/Fret.tsx";
import {Note} from "@/types/Note.ts";

const meta = {
    title: 'Fret',
    component: Fret,
    parameters: {
        // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Fret>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        fretNumber: 2,
        notes:[
            {
                note: new Note('F#'),
                isSelected: false,
            },
            {
                note: new Note('C'),
                isSelected: false,
            },
            {
                note: new Note('A'),
                isSelected: false,
            },
            {
                note: new Note('E'),
                isSelected: true,
            },
            {
                note: new Note('B'),
                isSelected: true,
            },
            {
                note: new Note('G'),
                isSelected: false,
            },
        ]
    }
};
