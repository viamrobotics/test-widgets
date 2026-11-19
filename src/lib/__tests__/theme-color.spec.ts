import '../../app.css'

import { afterEach, describe, expect, it } from 'vitest'

import { themeColor } from '../theme-color.ts'

const MAP_VARIABLES = [
	'--color-solar-power-bright',
	'--color-hologram-bright',
	'--color-cyberpunk-bright',
	'--color-power-wire-bright',
] as const

const COMPOSED_VARIABLE_NAME = /--color-\$\{|['"`]--color-['"`]\s*\+/

const librarySources = import.meta.glob<string>(
	['/src/lib/**/*.{ts,svelte}', '!/src/lib/**/__tests__/**'],
	{ query: '?raw', import: 'default', eager: true }
)

const setStyleSheetsDisabled = (isDisabled: boolean) => {
	for (const sheet of document.styleSheets) {
		sheet.disabled = isDisabled
	}
}

afterEach(() => {
	document.documentElement.style.removeProperty('--color-solar-power-bright')
	setStyleSheetsDisabled(false)
})

describe('themeColor', () => {
	it('returns the value the root sets for the variable', () => {
		document.documentElement.style.setProperty('--color-solar-power-bright', 'rgb(1, 2, 3)')

		expect(themeColor('--color-solar-power-bright')).toBe('rgb(1, 2, 3)')
	})

	it('returns an empty string when no stylesheet defines the variable', () => {
		setStyleSheetsDisabled(true)

		expect(themeColor('--color-hologram-bright')).toBe('')
	})

	it.each(MAP_VARIABLES)('reads %s from the app stylesheet', (variable) => {
		expect(themeColor(variable)).toMatch(/^#[0-9a-f]{6}$/i)
	})
})

describe('theme color variable names in library source', () => {
	it('are never composed from a short token, since Tailwind drops a variable it cannot see named', () => {
		const composing = Object.keys(librarySources).filter((path) =>
			COMPOSED_VARIABLE_NAME.test(librarySources[path] ?? '')
		)

		expect(composing, `${Object.keys(librarySources).length} files scanned`).toEqual([])
	})

	it.each(MAP_VARIABLES)('names %s in full outside the specs, so Tailwind emits it', (variable) => {
		const naming = Object.keys(librarySources).filter((path) =>
			librarySources[path]?.includes(variable)
		)

		expect(naming.length, `${variable} appears in no library source file`).toBeGreaterThan(0)
	})
})
