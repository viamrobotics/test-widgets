import { describe, expect, it } from 'vitest'

import { getImageSize } from '../get-image-size.ts'

describe('getImageSize', () => {
	it('returns the best fit size for a landscape photo that is larger than the container', () => {
		const img = { naturalWidth: 1800, naturalHeight: 1200 } as HTMLImageElement
		const node = { clientWidth: 1024, clientHeight: 768 } as HTMLElement
		const size = getImageSize(img, node)
		expect(size.width / size.height).toBeCloseTo(img.naturalWidth / img.naturalHeight)
		expect(size.width).toBeCloseTo((node.clientWidth * 2) / 3)
	})

	it('returns the best fit size for a landscape photo that is smaller than the container', () => {
		const img = { naturalWidth: 1800, naturalHeight: 1200 } as HTMLImageElement
		const node = { clientWidth: 3600, clientHeight: 2400 } as HTMLElement
		const size = getImageSize(img, node)
		expect(size.width / size.height).toBeCloseTo(img.naturalWidth / img.naturalHeight)
		expect(size.width).toBe(img.naturalWidth)
	})

	it('returns the best fit size for a portrait photo that is larger than the container', () => {
		const img = { naturalWidth: 1600, naturalHeight: 2400 } as HTMLImageElement
		const node = { clientWidth: 1200, clientHeight: 800 } as HTMLElement
		const size = getImageSize(img, node)
		expect(size.width / size.height).toBeCloseTo(img.naturalWidth / img.naturalHeight)
		expect(size.height).toBeCloseTo((window.innerHeight * 2) / 3)
	})

	it('returns the best fit size for a portrait photo that is smaller than the container', () => {
		const img = { naturalWidth: 1600, naturalHeight: 2400 } as HTMLImageElement
		const node = { clientWidth: 3600, clientHeight: 3000 } as HTMLElement
		const size = getImageSize(img, node)
		expect(size.width / size.height).toBeCloseTo(img.naturalWidth / img.naturalHeight)
		expect(size.height).toBeCloseTo((window.innerHeight * 2) / 3)
	})

	it('returns the best fit size for a landscape photo that is larger than a specified max width', () => {
		const img = { naturalWidth: 1800, naturalHeight: 1200 } as HTMLImageElement
		const maxDimensions = { maxHeight: 1024, maxWidth: 768 }
		const size = getImageSize(img, maxDimensions)
		expect(size.width / size.height).toBeCloseTo(img.naturalWidth / img.naturalHeight)
		expect(size.width).toBeCloseTo(maxDimensions.maxWidth)
	})

	it('returns the best fit size for a landscape photo that is larger than a specified max height', () => {
		const img = { naturalWidth: 1200, naturalHeight: 1800 } as HTMLImageElement
		const maxDimensions = { maxHeight: 1024, maxWidth: 768 }
		const size = getImageSize(img, maxDimensions)
		expect(size.width / size.height).toBeCloseTo(img.naturalWidth / img.naturalHeight)
		expect(size.height).toBeCloseTo(maxDimensions.maxHeight)
	})
})
