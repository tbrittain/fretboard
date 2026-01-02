import type { Meta, StoryObj } from '@storybook/react-vite';
import Fret from "@/components/Fret.tsx";

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

export const Default: Story = {};
