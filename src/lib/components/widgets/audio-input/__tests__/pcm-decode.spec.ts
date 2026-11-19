import { describe, expect, it } from 'vitest'

import { decodePcm, PcmDecodeError, PLAYABLE_CODECS } from '../pcm-decode'

const channelsOf = (decoded: Float32Array[]) => decoded.map((samples) => [...samples])

describe('decodePcm', () => {
	it('splits interleaved little-endian int16 frames into channels scaled by 32768', () => {
		const bytes = new Uint8Array([0x00, 0x40, 0x00, 0x80, 0x00, 0x00, 0xff, 0x7f])

		const decoded = decodePcm(bytes, 'pcm16', 2)

		expect(channelsOf(decoded)).toEqual([
			[0.5, 0],
			[-1, 0.999969482421875],
		])
	})

	it('scales little-endian int32 samples by 2147483648', () => {
		const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x80])

		const decoded = decodePcm(bytes, 'pcm32', 1)

		expect(channelsOf(decoded)).toEqual([[0.5, -1]])
	})

	it('reads little-endian float32 samples as they are', () => {
		const bytes = new Uint8Array([0x00, 0x00, 0x80, 0x3e, 0x00, 0x00, 0x40, 0xbf])

		const decoded = decodePcm(bytes, 'pcm32_float', 2)

		expect(channelsOf(decoded)).toEqual([[0.25], [-0.75]])
	})

	it('clamps a float32 sample past full scale to 1', () => {
		const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x40])

		const decoded = decodePcm(bytes, 'pcm32_float', 1)

		expect(channelsOf(decoded)).toEqual([[1]])
	})

	it('reads from the view an SDK chunk carries, not from the start of its buffer', () => {
		const backing = new Uint8Array([0xff, 0xff, 0x00, 0x40])

		const decoded = decodePcm(backing.subarray(2), 'pcm16', 1)

		expect(channelsOf(decoded)).toEqual([[0.5]])
	})

	it('throws a PcmDecodeError when the bytes end partway through a frame', () => {
		const sixBytesOfStereoInt16 = new Uint8Array([0, 0, 0, 0, 0, 0])

		expect(() => decodePcm(sixBytesOfStereoInt16, 'pcm16', 2)).toThrow(
			new PcmDecodeError('6 bytes is not a whole number of 4 byte pcm16 frames')
		)
	})

	it('throws a PcmDecodeError for a compressed codec', () => {
		expect(() => decodePcm(new Uint8Array([0, 0]), 'opus', 1)).toThrow(
			new PcmDecodeError('Cannot play opus audio in this browser')
		)
	})

	it('throws a PcmDecodeError for a channel count below 1', () => {
		expect(() => decodePcm(new Uint8Array([0, 0]), 'pcm16', 0)).toThrow(
			new PcmDecodeError('Cannot play audio with 0 channels')
		)
	})

	it('names its error PcmDecodeError', () => {
		expect(new PcmDecodeError('x').name).toBe('PcmDecodeError')
	})
})

describe('PLAYABLE_CODECS', () => {
	it('holds the three PCM codecs and no compressed one', () => {
		expect([...PLAYABLE_CODECS]).toEqual(['pcm16', 'pcm32', 'pcm32_float'])
	})
})
