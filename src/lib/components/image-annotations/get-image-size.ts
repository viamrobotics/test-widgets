export interface Size {
	/** The image height, with a max height determined by its container */
	height: number;
	/** The image width, resized to match aspect ratio determined by height */
	width: number;
}

export const getImageSize = (img: HTMLImageElement, container: HTMLElement): Size => {
	const aspectRatio = img.naturalWidth / img.naturalHeight;

	if (img.naturalHeight > img.naturalWidth) {
		let heightNumber = Math.min(container.clientHeight, img.naturalHeight);
		let widthNumber = heightNumber * aspectRatio;

		// if scaled width is still too large for container, scale down again
		if (widthNumber > container.clientWidth) {
			const downScale = container.clientWidth / widthNumber;
			widthNumber = container.clientWidth;
			heightNumber *= downScale;
		}

		return {
			width: widthNumber,
			height: heightNumber
		};
	}

	let widthNumber = Math.min(container.clientWidth, img.naturalWidth);
	let heightNumber = widthNumber * (1 / aspectRatio);

	// if scaled height is still too large for container, scale down again
	if (heightNumber > container.clientHeight) {
		const downScale = container.clientHeight / heightNumber;
		heightNumber = container.clientHeight;
		widthNumber *= downScale;
	}
	return {
		width: widthNumber,
		height: heightNumber
	};
};
