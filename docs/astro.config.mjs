import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import remarkGfm from 'remark-gfm'
import starlightThemeNova from 'starlight-theme-nova'

const base = process.env.DOCS_BASE ?? '/test-widgets/'
const site = process.env.DOCS_SITE ?? 'https://viamrobotics.github.io'

export default defineConfig({
	site,
	base,
	markdown: {
		remarkPlugins: [remarkGfm],
	},
	integrations: [
		starlight({
			plugins: [starlightThemeNova()],
			title: 'Viam Test Widgets',
			description: 'Svelte test widgets for interacting with Viam machines.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/viamrobotics/test-widgets',
				},
			],
			customCss: [
				'@fontsource-variable/roboto-mono',
				'@fontsource-variable/public-sans',
				'./src/tailwind.css',
			],
			sidebar: [
				{ label: 'Introduction', link: '/' },
				{ label: 'Getting started', link: '/getting-started/' },
				{ label: 'Playground', link: '/playground/' },
			],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
})
