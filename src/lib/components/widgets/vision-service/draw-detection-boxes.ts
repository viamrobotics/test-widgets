import type { Detection } from './context.svelte'

/** The border of a box that is neither hovered nor selected. */
export const INACTIVE_BOX_COLOR = '#aaa'

/** The on-screen border width of a box, in CSS pixels. */
export const BOX_BORDER_WIDTH_PX = 2

interface DrawDetectionBoxesOptions {
	/** Whether a detection is hovered or selected, which draws its border in its label color. */
	isActive: (detection: Detection) => boolean
	/** The on-screen scale of the image, as `getImageSize` reports it, so borders keep their on-screen width. */
	factor: number
}

/**
 * Draws each detection's box onto a 2D canvas holding the image at its natural size, as the boxes
 * canvas shows them on screen. Box coordinates are in the image's own pixels.
 */
export const drawDetectionBoxes = (
	context: CanvasRenderingContext2D,
	detections: Detection[],
	{ isActive, factor }: DrawDetectionBoxesOptions
) => {
	const lineWidth = factor > 0 ? BOX_BORDER_WIDTH_PX / factor : BOX_BORDER_WIDTH_PX
	context.lineWidth = lineWidth
	for (const detection of detections) {
		const xMin = Number(detection.xMin)
		const yMin = Number(detection.yMin)
		const width = Number(detection.xMax) - xMin
		const height = Number(detection.yMax) - yMin
		context.strokeStyle = isActive(detection) ? detection.color : INACTIVE_BOX_COLOR
		// The on-screen border sits inside the box, so the stroke is inset by half its width.
		context.strokeRect(
			xMin + lineWidth / 2,
			yMin + lineWidth / 2,
			Math.max(width - lineWidth, 0),
			Math.max(height - lineWidth, 0)
		)
	}
}
