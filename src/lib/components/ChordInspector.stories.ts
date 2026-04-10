import type { Meta, StoryObj } from '@storybook/sveltekit';
import ChordInspector from './ChordInspector.svelte';

const meta = {
	title: 'Components/ChordInspector',
	component: ChordInspector,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof ChordInspector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
