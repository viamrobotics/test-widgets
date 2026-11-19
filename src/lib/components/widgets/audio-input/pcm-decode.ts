/** The codecs whose chunks are raw interleaved little-endian samples Web Audio plays with no decoder. */
export const PLAYABLE_CODECS: ReadonlySet<string> = new Set(['pcm16', 'pcm32', 'pcm32_float'])

/** Thrown when a chunk's bytes cannot be read as PCM samples for its codec and channel count. */
export class PcmDecodeError extends Error {
	override name = 'PcmDecodeError'
}

interface SampleFormat {
	bytesPerSample: number
	read: (view: DataView, offset: number) => number
}

const INT16_SCALE = 32_768
const INT32_SCALE = 2_147_483_648
const LITTLE_ENDIAN = true

const SAMPLE_FORMATS: Record<string, SampleFormat> = {
	pcm16: {
		bytesPerSample: 2,
		read: (view, offset) => view.getInt16(offset, LITTLE_ENDIAN) / INT16_SCALE,
	},
	pcm32: {
		bytesPerSample: 4,
		read: (view, offset) => view.getInt32(offset, LITTLE_ENDIAN) / INT32_SCALE,
	},
	pcm32_float: {
		bytesPerSample: 4,
		read: (view, offset) => Math.min(1, Math.max(-1, view.getFloat32(offset, LITTLE_ENDIAN))),
	},
}

/**
 * Splits interleaved little-endian PCM bytes into one channel of samples each, from -1 to 1.
 *
 * @throws {PcmDecodeError} When the codec is not PCM, the channel count is below 1, or the bytes
 * are not a whole number of frames.
 */
export const decodePcm = (
	bytes: Uint8Array,
	codec: string,
	channelCount: number
): Float32Array<ArrayBuffer>[] => {
	const format = SAMPLE_FORMATS[codec]
	if (format === undefined) {
		throw new PcmDecodeError(`Cannot play ${codec} audio in this browser`)
	}
	if (!Number.isInteger(channelCount) || channelCount < 1) {
		throw new PcmDecodeError(`Cannot play audio with ${String(channelCount)} channels`)
	}

	const frameBytes = format.bytesPerSample * channelCount
	if (bytes.byteLength % frameBytes !== 0) {
		throw new PcmDecodeError(
			`${String(bytes.byteLength)} bytes is not a whole number of ${String(frameBytes)} byte ${codec} frames`
		)
	}

	const frameCount = bytes.byteLength / frameBytes
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	return Array.from({ length: channelCount }, (_, channel) => {
		const samples = new Float32Array(frameCount)
		for (let frame = 0; frame < frameCount; frame++) {
			samples[frame] = format.read(view, frame * frameBytes + channel * format.bytesPerSample)
		}
		return samples
	})
}
