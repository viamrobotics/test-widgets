export interface Size {
	/** The image width, resized to the natural width with a max of 66% width of the test card */
	width: number
	/** The image height, resized by the aspect ratio */
	height: number
	/** The resizing factor. For example, from 1000px to 800px would be 0.8 */
	factor: number
}

interface ContainerSizeOptions {
	maxHeight: number
	maxWidth: number
}

const twoThirds = 2 / 3

export const getImageSize = (
	img: HTMLImageElement,
	container: HTMLElement | ContainerSizeOptions
): Size => {
	const aspectRatio = img.naturalWidth / img.naturalHeight

	/**
	 * Portrait images
	 */
	if (img.naturalHeight > img.naturalWidth) {
		// Allow a maximum height of 2/3 of the browser window or up to an arbitrarily specified height
		const maxHeight =
			'maxHeight' in container ? container.maxHeight : window.innerHeight * twoThirds
		const heightNumber = Math.min(maxHeight, img.naturalHeight)
		return {
			width: heightNumber * aspectRatio,
			height: heightNumber,
			factor: 1 - (img.naturalHeight - heightNumber) / img.naturalHeight,
		}
	}

	/**
	 * Landscape images
	 */
	// Allow a maximum width of 2/3 of the container's width or up to an arbitrarily specified width
	const maxWidth = 'maxWidth' in container ? container.maxWidth : container.clientWidth * twoThirds
	const widthNumber = Math.min(maxWidth, img.naturalWidth)
	return {
		width: widthNumber,
		height: widthNumber * (1 / aspectRatio),
		factor: 1 - (img.naturalWidth - widthNumber) / img.naturalWidth,
	}
}
