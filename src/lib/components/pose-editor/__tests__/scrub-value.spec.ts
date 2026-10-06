import { describe, expect, it } from 'vitest'

import { scrubbedValue } from '../scrub-value'

const plain = { shift: false, alt: false }

describe('scrubbedValue', () => {
	it('moves one step per pixel', () => {
		expect(scrubbedValue(0, 100, 0.1, plain)).toBe(10)
	})

	it('keeps the decimals of a fine step', () => {
		expect(scrubbedValue(0, 100, 0.001, plain)).toBe(0.1)
	})

	it('multiplies the rate by 10 with Shift', () => {
		expect(scrubbedValue(0, 100, 0.1, { shift: true, alt: false })).toBe(100)
	})

	it('multiplies the rate by 0.1 with Alt and keeps one more decimal', () => {
		expect(scrubbedValue(0, 7, 0.1, { shift: false, alt: true })).toBe(0.07)
	})

	it('subtracts for a negative dx', () => {
		expect(scrubbedValue(5, -20, 0.1, plain)).toBe(3)
	})

	it('shows no floating point noise', () => {
		expect(scrubbedValue(0.1, 2, 0.1, plain)).toBe(0.3)
	})
})
