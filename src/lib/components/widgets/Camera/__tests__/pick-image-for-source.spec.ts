import { describe, expect, it } from 'vitest'

import { pickImageForSource } from '../pick-image-for-source'

describe('pickImageForSource', () => {
	it('returns the image matching the source name', () => {
		const images = [
			{ sourceName: 'color', image: new Uint8Array([1]) },
			{ sourceName: 'depth', image: new Uint8Array([2]) },
		]
		expect(pickImageForSource(images, 'depth')).toBe(images[1])
	})

	it('falls back to the first image when the source name is not found', () => {
		const images = [
			{ sourceName: 'color', image: new Uint8Array([1]) },
			{ sourceName: 'depth', image: new Uint8Array([2]) },
		]
		expect(pickImageForSource(images, 'ir')).toBe(images[0])
	})

	it('returns the first image when no source name is provided', () => {
		const images = [{ sourceName: 'color' }, { sourceName: 'depth' }]
		expect(pickImageForSource(images, '')).toBe(images[0])
	})

	it('returns undefined when there are no images', () => {
		expect(pickImageForSource([], 'color')).toBeUndefined()
	})

	it('returns undefined when images is undefined', () => {
		expect(pickImageForSource(undefined, 'color')).toBeUndefined()
	})
})
