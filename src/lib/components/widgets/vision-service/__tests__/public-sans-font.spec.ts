import { describe, expect, it } from 'vitest'

import { getPublicSansFont } from '../public-sans-font'

describe('getPublicSansFont', () => {
	it('resolves the page to a single absolute URL', () => {
		const { pages } = getPublicSansFont()
		expect(pages).toHaveLength(1)
		expect(() => new URL(pages[0]!)).not.toThrow()
	})

	it('returns the same object on every call', () => {
		expect(getPublicSansFont()).toBe(getPublicSansFont())
	})

	it('has characters', () => {
		expect(getPublicSansFont().chars.length).toBeGreaterThan(0)
	})
})
