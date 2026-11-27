import { fireEvent } from '@testing-library/svelte'

/** The natural size of the image `createImageFile` draws. */
export const IMAGE_WIDTH = 400
export const IMAGE_HEIGHT = 300

/** Draws a real PNG at `IMAGE_WIDTH` by `IMAGE_HEIGHT`, so the browser can decode its size. */
export const createImageFile = async (name = 'scene.png'): Promise<File> => {
	const canvas = new OffscreenCanvas(IMAGE_WIDTH, IMAGE_HEIGHT)
	const context = canvas.getContext('2d')
	if (context === null) throw new Error('No 2D context to draw the test image')
	context.fillStyle = 'teal'
	context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT)
	const blob = await canvas.convertToBlob({ type: 'image/png' })
	return new File([blob], name, { type: 'image/png' })
}

/** Puts `file` in the widget's hidden file input, as the browser's file picker would. */
export const chooseFile = async (container: HTMLElement, file: File) => {
	const input = container.querySelector('input[type="file"]')
	if (!(input instanceof HTMLInputElement)) throw new Error('The widget rendered no file input')
	const transfer = new DataTransfer()
	transfer.items.add(file)
	input.files = transfer.files
	await fireEvent.change(input)
}
