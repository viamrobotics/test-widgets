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
	// The scoped scene imports an HDR environment map, and the optimizer does not apply `assetsInclude`.
	assetsInclude: ['**/*.hdr'],
	optimizeDeps: {
		exclude: ['@viamrobotics/visualization'],
		// Visualization imports the `/webgpu` entries. Served unbundled, each brings a second copy of
		// its package next to the prebundled root entry, so Threlte's context keys stop matching.
		include: ['@threlte/core/webgpu', '@threlte/extras/webgpu', 'three/webgpu', 'three/tsl'],
	},
	plugins: [
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
