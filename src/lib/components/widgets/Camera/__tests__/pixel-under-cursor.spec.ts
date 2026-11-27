import { describe, expect, it } from 'vitest'

import { pixelUnderCursor } from '../pixel-under-cursor'

const SQUARE_BOX = { boxWidth: 400, boxHeight: 400 }
const WIDE_SOURCE = { sourceWidth: 200, sourceHeight: 100 }
const CURSOR = { offsetX: 100, offsetY: 150 }

describe('pixelUnderCursor', () => {
	it.each([
		{
			fit: 'Keep ratio, where the box already has the source ratio',
			input: { ...CURSOR, boxWidth: 400, boxHeight: 200, ...WIDE_SOURCE, objectFit: 'contain' },
			expected: { x: 50, y: 75, fractionX: 0.25, fractionY: 0.75 },
		},
		{
			fit: 'Fit, letterboxed with 100 px bars above and below',
			input: { ...CURSOR, ...SQUARE_BOX, ...WIDE_SOURCE, objectFit: 'contain' },
			expected: { x: 50, y: 25, fractionX: 0.25, fractionY: 0.25 },
		},
		{
			fit: 'Stretch, scaled 2x across and 4x down',
			input: { ...CURSOR, ...SQUARE_BOX, ...WIDE_SOURCE, objectFit: 'fill' },
			expected: { x: 50, y: 37.5, fractionX: 0.25, fractionY: 0.375 },
		},
		{
			fit: 'Crop to fill, scaled 4x with 200 px cut off each side',
			input: { ...CURSOR, ...SQUARE_BOX, ...WIDE_SOURCE, objectFit: 'cover' },
			expected: { x: 75, y: 37.5, fractionX: 0.375, fractionY: 0.375 },
		},
	])('maps the cursor to the source pixel under $fit', ({ input, expected }) => {
		expect(pixelUnderCursor(input)).toEqual(expected)
	})

	it('clamps a cursor over a letterbox bar to the nearest edge of the image', () => {
		const input = { offsetX: 100, offsetY: 50, ...SQUARE_BOX, ...WIDE_SOURCE, objectFit: 'contain' }

		expect(pixelUnderCursor(input)).toEqual({ x: 50, y: 0, fractionX: 0.25, fractionY: 0 })
	})

	it('reads an object-fit the frame never sets as a stretch', () => {
		const input = { ...CURSOR, ...SQUARE_BOX, ...WIDE_SOURCE, objectFit: 'scale-down' }

		expect(pixelUnderCursor(input)).toEqual({ x: 50, y: 37.5, fractionX: 0.25, fractionY: 0.375 })
	})

	it('reports the origin before the source has a size', () => {
		const input = { ...CURSOR, ...SQUARE_BOX, sourceWidth: 0, sourceHeight: 0, objectFit: 'fill' }

		expect(pixelUnderCursor(input)).toEqual({ x: 0, y: 0, fractionX: 0, fractionY: 0 })
	})
})
