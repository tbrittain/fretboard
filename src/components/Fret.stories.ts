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
        notes:[
            {
                note: new Note('F#2'),
                isSelected: false,
            },
            {
                note: new Note('B2'),
                isSelected: false,
            },
            {
                note: new Note('E3'),
                isSelected: false,
            },
            {
                note: new Note('G3'),
                isSelected: true,
                onClick: () => alert('Guitar note clicked'),
            },
            {
                note: new Note('B3'),
                isSelected: false,
            },
            {
                note: new Note('F#4'),
                isSelected: false,
            },
        ]
    }
};
