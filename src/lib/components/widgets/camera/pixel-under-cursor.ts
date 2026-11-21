/** The CSS `object-fit` values the media frame's fits apply. Any other value is read as `fill`. */
type ObjectFit = 'contain' | 'cover' | 'fill'

/** A point in the source image, in its own pixels and as a fraction of its size. */
interface PixelUnderCursor {
	x: number
	y: number
	fractionX: number
	fractionY: number
}

interface PixelUnderCursorInput {
	/** The cursor's offset from the element box's top left corner, in CSS pixels. */
	offsetX: number
	offsetY: number
	boxWidth: number
	boxHeight: number
	sourceWidth: number
	sourceHeight: number
	/** The element's computed `object-fit`, which sets where the source draws inside the box. */
	objectFit: string
}

const toObjectFit = (value: string): ObjectFit => {
	if (value === 'contain' || value === 'cover') return value
	return 'fill'
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max)

/** The scale from source pixels to box pixels on each axis. Contain and cover keep the ratio, fill does not. */
const scaleFor = (fit: ObjectFit, input: PixelUnderCursorInput) => {
	const scaleX = input.boxWidth / input.sourceWidth
	const scaleY = input.boxHeight / input.sourceHeight
	if (fit === 'contain') {
		const scale = Math.min(scaleX, scaleY)
		return { scaleX: scale, scaleY: scale }
	}
	if (fit === 'cover') {
		const scale = Math.max(scaleX, scaleY)
		return { scaleX: scale, scaleY: scale }
	}
	return { scaleX, scaleY }
}

/**
 * The source image's pixel under the cursor, for an image or video drawn centered in its box at
 * `objectFit`. A cursor over a letterbox bar clamps to the nearest edge of the image.
 */
export const pixelUnderCursor = (input: PixelUnderCursorInput): PixelUnderCursor => {
	const { sourceWidth, sourceHeight } = input
	if (sourceWidth <= 0 || sourceHeight <= 0 || input.boxWidth <= 0 || input.boxHeight <= 0) {
		return { x: 0, y: 0, fractionX: 0, fractionY: 0 }
	}

	const { scaleX, scaleY } = scaleFor(toObjectFit(input.objectFit), input)
	const drawnLeft = (input.boxWidth - sourceWidth * scaleX) / 2
	const drawnTop = (input.boxHeight - sourceHeight * scaleY) / 2
	const x = clamp((input.offsetX - drawnLeft) / scaleX, sourceWidth)
	const y = clamp((input.offsetY - drawnTop) / scaleY, sourceHeight)

	return { x, y, fractionX: x / sourceWidth, fractionY: y / sourceHeight }
}
