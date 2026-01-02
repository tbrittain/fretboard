import type { Meta, StoryObj } from '@storybook/react-vite';
import GuitarNeck from "@/components/GuitarNeck.tsx";

const meta = {
    title: 'Guitar Neck',
    component: GuitarNeck,
    parameters: {
        // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
        layout: 'fullscreen',
    },
} satisfies Meta<typeof GuitarNeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
    }
};
