import { describe, expect, it } from 'vitest'

import { decodeViamDepth } from '../decode-viam-depth'

const encodeDepthFrame = (width: number, height: number, depths: number[]): Uint8Array => {
	const bytes = new Uint8Array(24 + depths.length * 2)
	const view = new DataView(bytes.buffer)
	// 8-byte magic (DEPTHMAP) — value isn't checked by the decoder but we set it for fidelity.
	view.setBigUint64(0, 0x44_45_50_54_48_4d_41_50n, false)
	view.setBigUint64(8, BigInt(width), false)
	view.setBigUint64(16, BigInt(height), false)
	for (let i = 0; i < depths.length; i++) {
		view.setUint16(24 + i * 2, depths[i]!, false)
	}
	return bytes
}

describe('decodeViamDepth', () => {
	it('decodes width and height from the header', () => {
		const result = decodeViamDepth(encodeDepthFrame(2, 3, [0, 0, 0, 0, 0, 0]))
		expect(result).toBeDefined()
		expect(result!.width).toBe(2)
		expect(result!.height).toBe(3)
	})

	it('maps near depths to warm hues and far depths to cool hues', () => {
		const result = decodeViamDepth(encodeDepthFrame(2, 1, [100, 200]))
		expect(result).toBeDefined()
		// Near (hue 30°, orange-yellow): high red, some green, no blue
		expect(result!.pixels[0]).toBeGreaterThan(result!.pixels[1]!)
		expect(result!.pixels[2]).toBe(0)
		expect(result!.pixels[3]).toBe(255) // alpha
		// Far (hue 230°, blue): high blue, some green, no red
		expect(result!.pixels[6]).toBeGreaterThan(result!.pixels[5]!)
		expect(result!.pixels[4]).toBe(0)
		expect(result!.pixels[7]).toBe(255) // alpha
	})

	it('renders zero-depth pixels as opaque black and skips them from min/max', () => {
		const result = decodeViamDepth(encodeDepthFrame(3, 1, [0, 100, 200]))
		expect(result).toBeDefined()
		// zero → opaque black
		expect(result!.pixels[0]).toBe(0)
		expect(result!.pixels[1]).toBe(0)
		expect(result!.pixels[2]).toBe(0)
		expect(result!.pixels[3]).toBe(255)
		// 100 is the new min; far end of the range goes to 200, not influenced by the zero.
		expect(result!.pixels[7]).toBe(255) // alpha
		expect(result!.pixels[11]).toBe(255) // alpha
	})

	it('renders an all-zero frame as entirely opaque black', () => {
		const result = decodeViamDepth(encodeDepthFrame(2, 1, [0, 0]))
		expect(result).toBeDefined()
		expect([...result!.pixels]).toEqual([0, 0, 0, 255, 0, 0, 0, 255])
	})

	it('returns undefined when the buffer is shorter than the header', () => {
		expect(decodeViamDepth(new Uint8Array(10))).toBeUndefined()
	})

	it('returns undefined when the buffer is missing pixel data', () => {
		// Header claims 4 pixels (8 bytes) but only 2 bytes follow.
		const bytes = new Uint8Array(26)
		const view = new DataView(bytes.buffer)
		view.setBigUint64(8, 2n, false)
		view.setBigUint64(16, 2n, false)
		expect(decodeViamDepth(bytes)).toBeUndefined()
	})
})
