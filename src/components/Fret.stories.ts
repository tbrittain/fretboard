import type { Meta, StoryObj } from '@storybook/react-vite';
import Fret from "@/components/Fret.tsx";
import {getEStandardFretNotes} from "@/types/GuitarNeckEStandardTuning.ts";

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
        notes: getEStandardFretNotes(2).map((note, index) => {
            // selected on A and D strings (5th and 4th)
            const isSelected = (index === 3 || index === 4);
            return { note: note.note, isSelected };
        })
    }
};
