import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import { playwright } from '@vitest/browser-playwright'
import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig } from 'vitest/config'

const isCI = Boolean(process.env.CI)

const isRootRelative = (value: string): value is `/${string}` => value.startsWith('/')

/** Reads `BASE_PATH`, which SvelteKit requires to be empty or to start with `/`. */
const readBasePath = (): '' | `/${string}` => {
	const basePath = process.env.BASE_PATH ?? ''
	if (basePath === '' || isRootRelative(basePath)) return basePath
	throw new Error(`BASE_PATH must be empty or start with "/", got "${basePath}"`)
}

export default defineConfig({
	server: {
		port: 6173,
	},
	resolve: {
		// three is a peer of this package and of the visualizer. Two copies break `instanceof`.
		dedupe: ['three'],
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			dynamicCompileOptions: ({ filename }) =>
				filename.includes('node_modules') ? undefined : { runes: true },
			adapter: adapter({ fallback: 'index.html' }),
			paths: {
				// SvelteKit requires no trailing slash here. The pr-preview workflow sets
				// /test-widgets/pr-preview/pr-<N> so the static build resolves under that subpath.
				base: readBasePath(),
			},
		}),
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
