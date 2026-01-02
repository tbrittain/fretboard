import type { Meta, StoryObj } from '@storybook/react-vite';
import {GuitarNote} from "@/components/GuitarNote.tsx";
import {Note} from "@/types/Note.ts";

const meta = {
    title: 'Guitar Note',
    component: GuitarNote,
    parameters: {
        // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
        layout: 'fullscreen',
    },
} satisfies Meta<typeof GuitarNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        note: new Note('C'),
        onClick: (note) => alert(`Guitar note ${note.toString()} clicked`)
    }
};

export const Selected: Story = {
    args: {
        note: new Note('G4'),
        isSelected: true,
        onClick: (note) => alert(`Guitar note ${note.toString()} clicked`)
    }
};

export const DifferentStringThickness: Story = {
    args: {
        note: new Note('E2'),
        stringThickness: 8,
        onClick: (note) => alert(`Guitar note ${note.toString()} clicked`)
    }
};

export const DisplayNoNoteWhenSelected: Story = {
    args: {
        note: new Note('A3'),
        isSelected: true,
        displayNoteWhenSelected: false,
        onClick: (note) => alert(`Guitar note ${note.toString()} clicked`)
    }
};
