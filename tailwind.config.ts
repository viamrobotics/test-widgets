import type { Config } from 'tailwindcss';

import { plugins } from '@viamrobotics/prime-core/plugins';
import { theme } from '@viamrobotics/prime-core/theme';

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/@viamrobotics/prime-core/**/*.{ts,svelte}'
	],
	theme,
	plugins
} satisfies Config;
