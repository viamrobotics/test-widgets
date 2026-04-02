import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import { playwright } from '@vitest/browser-playwright'
import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig } from 'vitest/config'

const isCI = Boolean(process.env.CI)

export default defineConfig({
	server: {
		port: 6173,
	},
	plugins: [
		{
			name: 'fix-prime-core-theme',
			enforce: 'pre',
			transform(code, id) {
				if (!id.includes('prime-core')) return
				if (!code.includes('theme(')) return
				return code
					.replaceAll('theme(borderColor.light)', '#e4e4e6')
					.replaceAll(
						'theme(fontFamily.public-sans)',
						"'Public Sans Variable', 'Public Sans', sans-serif"
					)
					.replaceAll('theme(backgroundColor.light)', '#f7f7f8')
					.replaceAll('theme(backgroundColor.ghost-light)', 'rgba(0, 0, 0, 0.04)')
			},
		},
		tailwindcss(),
		sveltekit(),
		svelteTesting({
			// disable browser resolution condition
			resolveBrowser: false,
		}),
		devtoolsJson(),
	],
	test: {
		mockReset: true,
		restoreMocks: true,
		unstubGlobals: true,
		reporters: isCI ? ['dot'] : ['default'],
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }],
					},
					include: ['src/**/*.svelte.spec.ts', 'src/**/*.spec.ts'],
				},
			},
		],
	},
})
