import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		paths: {
			// SvelteKit requires no trailing slash here. The pr-preview workflow sets
			// /test-widgets/pr-preview/pr-<N> so the static build resolves under that subpath.
			base: process.env.BASE_PATH ?? '',
		},
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true },
	},
}

export default config
