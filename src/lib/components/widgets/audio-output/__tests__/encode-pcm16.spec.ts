import { describe, expect, it } from 'vitest'

import { encodePcm16 } from '../encode-pcm16'

describe('encodePcm16', () => {
	it('scales samples by 32768 into little-endian int16 bytes', () => {
		const bytes = encodePcm16([new Float32Array([0.5, -0.25, 0])])

		expect([...bytes]).toEqual([0x00, 0x40, 0x00, 0xe0, 0x00, 0x00])
	})

	it('joins chunks in order into one clip', () => {
		const bytes = encodePcm16([
			new Float32Array([0.5]),
			new Float32Array([]),
			new Float32Array([-0.5]),
		])

		expect([...bytes]).toEqual([0x00, 0x40, 0x00, 0xc0])
	})

	it('saturates samples past the int16 range', () => {
		const bytes = encodePcm16([new Float32Array([1, 1.5, -1, -2])])

		expect([...bytes]).toEqual([0xff, 0x7f, 0xff, 0x7f, 0x00, 0x80, 0x00, 0x80])
	})

	it('is empty for no samples', () => {
		expect(encodePcm16([])).toHaveLength(0)
	})
})
