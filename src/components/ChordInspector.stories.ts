import type { Meta, StoryObj } from '@storybook/react-vite';

import ChordInspector from "@/components/ChordInspector.tsx";

const meta = {
    title: 'Chord Inspector',
    component: ChordInspector,
    parameters: {
        // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
        layout: 'fullscreen',
    },
} satisfies Meta<typeof ChordInspector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
