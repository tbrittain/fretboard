import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@chromatic-com/storybook',
		'@storybook/addon-a11y',
		'@storybook/addon-docs',
	],
	framework: {
		name: '@storybook/sveltekit',
		options: {},
	},
};

export default config;
