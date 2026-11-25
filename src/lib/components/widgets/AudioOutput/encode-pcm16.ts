const BYTES_PER_SAMPLE = 2
const INT16_SCALE = 32_768
const INT16_MIN = -32_768
const INT16_MAX = 32_767
const LITTLE_ENDIAN = true

/**
 * Joins mono sample chunks, each sample from -1 to 1, into one clip of raw little-endian `pcm16`
 * bytes. Samples are scaled by 32768 and clamped to the int16 range, so a sample past 1 saturates.
 */
export const encodePcm16 = (chunks: readonly Float32Array[]): Uint8Array<ArrayBuffer> => {
	const sampleCount = chunks.reduce((total, chunk) => total + chunk.length, 0)
	const bytes = new Uint8Array(sampleCount * BYTES_PER_SAMPLE)
	const view = new DataView(bytes.buffer)

	let offset = 0
	for (const chunk of chunks) {
		for (const sample of chunk) {
			const scaled = Math.round(sample * INT16_SCALE)
			view.setInt16(offset, Math.min(INT16_MAX, Math.max(INT16_MIN, scaled)), LITTLE_ENDIAN)
			offset += BYTES_PER_SAMPLE
		}
	}
	return bytes
}
