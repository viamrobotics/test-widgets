import { describe, expect, it } from 'vitest'

import { getSourceNames } from '../get-source-names'

describe('getSourceNames', () => {
	it('returns unique source names from images', () => {
		const images = [
			{ sourceName: 'color' },
			{ sourceName: 'depth' },
			{ sourceName: 'color' },
		]
		expect(getSourceNames(images)).toEqual(['color', 'depth'])
	})

	it('filters out empty source names', () => {
		const images = [{ sourceName: '' }, { sourceName: 'color' }, { sourceName: '' }]
		expect(getSourceNames(images)).toEqual(['color'])
	})

	it('returns an empty array when there are no images', () => {
		expect(getSourceNames([])).toEqual([])
	})

	it('returns an empty array when all source names are empty', () => {
		const images = [{ sourceName: '' }, { sourceName: '' }]
		expect(getSourceNames(images)).toEqual([])
	})

	it('preserves the order of first occurrence', () => {
		const images = [
			{ sourceName: 'depth' },
			{ sourceName: 'color' },
			{ sourceName: 'depth' },
			{ sourceName: 'ir' },
		]
		expect(getSourceNames(images)).toEqual(['depth', 'color', 'ir'])
	})

	it('handles a single image', () => {
		const images = [{ sourceName: 'color' }]
		expect(getSourceNames(images)).toEqual(['color'])
	})
})
