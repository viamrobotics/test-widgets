/** MIME type used by Viam's custom 16-bit depth format. */
export const VIAM_DEPTH_MIME_TYPE = 'image/vnd.viam.dep'

const HEADER_BYTES = 24

// Hue sweep used by RDK's ToPrettyPicture: near = warm (~30°), far = cool (~230°).
const HUE_NEAR = 30
const HUE_FAR = 230

const hueToRgb = (hue: number): [number, number, number] => {
	const sector = hue / 60
	const x = Math.round((1 - Math.abs((sector % 2) - 1)) * 255)
	if (sector < 1) return [255, x, 0]
	if (sector < 2) return [x, 255, 0]
	if (sector < 3) return [0, 255, x]
	if (sector < 4) return [0, x, 255]
	if (sector < 5) return [x, 0, 255]
	return [255, 0, x]
}

/**
 * Decode the Viam depth format (`image/vnd.viam.dep`) and return a colorized
 * visualization (warm = near, cool = far), matching the hue sweep that RDK's
 * `DepthMap.ToPrettyPicture` produces. Pixels with depth 0 are rendered as
 * opaque black to match RDK. The wire format is:
 *
 * - bytes 0–8: magic `DEPTHMAP` (big-endian)
 * - bytes 8–16: width (big-endian uint64)
 * - bytes 16–24: height (big-endian uint64)
 * - bytes 24–end: depth values as big-endian uint16, row-major
 *
 * The browser cannot decode this MIME type natively, so depth frames must be
 * rendered to a canvas ourselves. References:
 *
 * - Reader: https://github.com/viamrobotics/rdk/blob/main/rimage/depth_map_raw.go (readDepthMapViam)
 * - Format registration: https://github.com/viamrobotics/rdk/blob/main/rimage/image_file.go
 * - Visualization (`DepthMap.ToPrettyPicture`):
 *   https://github.com/viamrobotics/rdk/blob/main/rimage/depth_map.go
 * - Python equivalent (`ViamImage.bytes_to_depth_array`):
 *   https://github.com/viamrobotics/viam-python-sdk/blob/main/src/viam/media/video.py
 *
 * Returns undefined if the buffer is too short to be a valid depth image.
 */
export const decodeViamDepth = (
	bytes: Uint8Array
): { width: number; height: number; pixels: Uint8ClampedArray } | undefined => {
	if (bytes.length < HEADER_BYTES) {
		return undefined
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const width = Number(view.getBigUint64(8, false))
	const height = Number(view.getBigUint64(16, false))
	const pixelCount = width * height

	if (bytes.length < HEADER_BYTES + pixelCount * 2) {
		return undefined
	}

	let min = Number.POSITIVE_INFINITY
	let max = 0
	for (let i = 0; i < pixelCount; i++) {
		const depth = view.getUint16(HEADER_BYTES + i * 2, false)
		if (depth === 0) continue
		if (depth < min) min = depth
		if (depth > max) max = depth
	}
	const span = Number.isFinite(min) ? Math.max(1, max - min) : 1
	const base = Number.isFinite(min) ? min : 0
	const hueSpan = HUE_FAR - HUE_NEAR

	const pixels = new Uint8ClampedArray(pixelCount * 4)
	for (let i = 0; i < pixelCount; i++) {
		const depth = view.getUint16(HEADER_BYTES + i * 2, false)
		const idx = i * 4
		pixels[idx + 3] = 255
		if (depth === 0) {
			// Unmeasured pixel — leave RGB at 0 (black) to match RDK.
			continue
		}
		const ratio = (depth - base) / span
		const [r, g, b] = hueToRgb(HUE_NEAR + ratio * hueSpan)
		pixels[idx] = r
		pixels[idx + 1] = g
		pixels[idx + 2] = b
	}

	return { width, height, pixels }
}
