import {
	type BoundingBox,
	type BoundingCoords,
	BoxModifier,
	type Coordinates,
	ResizeHandleLocation
} from './bounding-box-types';
import type { Size } from './get-image-size';

export const getBoundingRect = (
	original: BoundingBox,
	dragDistance: Coordinates | undefined,
	containerWidth: number,
	containerHeight: number,
	corner?: ResizeHandleLocation
): BoundingCoords => {
	let transformation: BoxModifier = BoxModifier.Scaled;

	if (dragDistance) {
		transformation = corner ? BoxModifier.Resized : BoxModifier.Translated;
	}

	// scale annotation size to container
	const scaledCopy = { ...original };
	scaledCopy.xMinNormalized *= containerWidth;
	scaledCopy.xMaxNormalized *= containerWidth;
	scaledCopy.yMinNormalized *= containerHeight;
	scaledCopy.yMaxNormalized *= containerHeight;

	if (transformation === BoxModifier.Scaled || !dragDistance) {
		return scaledCopy;
	}

	// apply transformation
	const unboundedRect =
		transformation === BoxModifier.Resized && corner
			? getResizedRect(scaledCopy, dragDistance, corner)
			: getTranslatedRect(scaledCopy, dragDistance, containerWidth, containerHeight);

	// ensure transformation does not exceed boundaries of container
	return {
		xMinNormalized: Math.max(unboundedRect.xMinNormalized, 0),
		xMaxNormalized: Math.min(unboundedRect.xMaxNormalized, containerWidth),
		yMinNormalized: Math.max(unboundedRect.yMinNormalized, 0),
		yMaxNormalized: Math.min(unboundedRect.yMaxNormalized, containerHeight)
	};
};

const getTranslatedRect = (
	original: BoundingBox,
	dragDistance: Coordinates,
	containerWidth: number,
	containerHeight: number
): BoundingCoords => {
	const modifiedRect: BoundingCoords = {
		xMinNormalized: original.xMinNormalized + dragDistance.x,
		xMaxNormalized: original.xMaxNormalized + dragDistance.x,
		yMinNormalized: original.yMinNormalized + dragDistance.y,
		yMaxNormalized: original.yMaxNormalized + dragDistance.y
	};
	// maintains box size if user attempts to drag a box beyond the bounds of the image
	if (modifiedRect.xMinNormalized <= 0) {
		modifiedRect.xMaxNormalized -= modifiedRect.xMinNormalized;
		modifiedRect.xMinNormalized = 0;
	}

	if (modifiedRect.yMinNormalized <= 0) {
		modifiedRect.yMaxNormalized -= modifiedRect.yMinNormalized;
		modifiedRect.yMinNormalized = 0;
	}

	if (modifiedRect.xMaxNormalized >= containerWidth) {
		modifiedRect.xMinNormalized =
			containerWidth - (modifiedRect.xMaxNormalized - modifiedRect.xMinNormalized);
		modifiedRect.xMaxNormalized = containerWidth;
	}

	if (modifiedRect.yMaxNormalized >= containerHeight) {
		modifiedRect.yMinNormalized =
			containerHeight - (modifiedRect.yMaxNormalized - modifiedRect.yMinNormalized);
		modifiedRect.yMaxNormalized = containerHeight;
	}

	return modifiedRect;
};

const getResizedRect = (
	original: BoundingBox,
	dragDistance: Coordinates,
	corner: ResizeHandleLocation
): BoundingCoords => {
	let variableX: keyof BoundingCoords | undefined = undefined;
	let variableY: keyof BoundingCoords | undefined = undefined;

	switch (corner) {
		case ResizeHandleLocation.T: {
			variableY = 'yMinNormalized';
			break;
		}
		case ResizeHandleLocation.R: {
			variableX = 'xMaxNormalized';
			break;
		}
		case ResizeHandleLocation.B: {
			variableY = 'yMaxNormalized';
			break;
		}
		case ResizeHandleLocation.L: {
			variableX = 'xMinNormalized';
			break;
		}
		case ResizeHandleLocation.TL: {
			variableX = 'xMinNormalized';
			variableY = 'yMinNormalized';
			break;
		}
		case ResizeHandleLocation.TR: {
			variableX = 'xMaxNormalized';
			variableY = 'yMinNormalized';
			break;
		}
		case ResizeHandleLocation.BL: {
			variableX = 'xMinNormalized';
			variableY = 'yMaxNormalized';
			break;
		}
		case ResizeHandleLocation.BR: {
			variableX = 'xMaxNormalized';
			variableY = 'yMaxNormalized';
			break;
		}
	}

	const modifiedRect = {
		...original
	};

	if (variableX) {
		modifiedRect[variableX] = original[variableX] + dragDistance.x;
	}

	if (variableY) {
		modifiedRect[variableY] = original[variableY] + dragDistance.y;
	}

	if (modifiedRect.xMinNormalized > modifiedRect.xMaxNormalized) {
		const temp = modifiedRect.xMaxNormalized;
		modifiedRect.xMaxNormalized = modifiedRect.xMinNormalized;
		modifiedRect.xMinNormalized = temp;
	}

	if (modifiedRect.yMinNormalized > modifiedRect.yMaxNormalized) {
		const temp = modifiedRect.yMaxNormalized;
		modifiedRect.yMaxNormalized = modifiedRect.yMinNormalized;
		modifiedRect.yMinNormalized = temp;
	}

	return modifiedRect;
};

export const shouldDisplayBoxFill = (
	annotationID: string,
	inEditMode: boolean,
	focusedID: string | undefined,
	editTargetID: string | undefined,
	hoveredAnnotations: Record<string, boolean>
) => {
	return (
		editTargetID === annotationID ||
		((focusedID ? focusedID === annotationID : Boolean(hoveredAnnotations[annotationID])) &&
			!inEditMode)
	);
};

export const createNormalizedTempBox = (
	label: string,
	size: Size,
	firstPoint: Coordinates,
	finalPoint: Coordinates
) => {
	// coordinates start in center, must translate all coordinates by one quadrant (i.e. half the height and width of container)
	const xMinNormalized = Math.min(firstPoint.x, finalPoint.x) / size.width;
	const xMaxNormalized = Math.max(firstPoint.x, finalPoint.x) / size.width;
	const yMinNormalized = Math.min(firstPoint.y, finalPoint.y) / size.height;
	const yMaxNormalized = Math.max(firstPoint.y, finalPoint.y) / size.height;

	return xMaxNormalized - xMinNormalized > 0.01 && yMaxNormalized - yMinNormalized > 0.01
		? {
				// if normalized values exceed bounds of image, lock to edge by setting to min/max value (0 and 1 respectively)
				xMinNormalized: Math.max(0, xMinNormalized),
				xMaxNormalized: Math.min(1, xMaxNormalized),
				yMinNormalized: Math.max(0, yMinNormalized),
				yMaxNormalized: Math.min(1, yMaxNormalized),
				label,
				id: '__NEW_TEMP_BBOX_ID__'
			}
		: undefined;
};

export const getModifyKeyForOS = () => {
	const isMac = navigator.userAgent.includes('Mac');
	return isMac ? 'metaKey' : 'ctrlKey';
};

export const calculatePastedBox = (
	mousePosition: Coordinates,
	copyTarget: BoundingBox,
	containerWidth: number,
	containerHeight: number
) => {
	const boxWidth = copyTarget.xMaxNormalized - copyTarget.xMinNormalized;
	const boxHeight = copyTarget.yMaxNormalized - copyTarget.yMinNormalized;

	// creates box centered on current mouse position
	const tempBox = {
		xMin: mousePosition.x / containerWidth - boxWidth / 2,
		xMax: mousePosition.x / containerWidth + boxWidth / 2,
		yMin: mousePosition.y / containerHeight - boxHeight / 2,
		yMax: mousePosition.y / containerHeight + boxHeight / 2
	};

	/**
	 * if side exceeds boundary of image, set exceeding side equal to boundary
	 * then translate parallel side by the same distance
	 */
	if (tempBox.xMin < 0) {
		tempBox.xMax -= tempBox.xMin;
		tempBox.xMin = 0;
	}

	if (tempBox.yMin < 0) {
		tempBox.yMax -= tempBox.yMin;
		tempBox.yMin = 0;
	}

	if (tempBox.xMax > 1) {
		tempBox.xMin -= tempBox.xMax - 1;
		tempBox.xMax = 1;
	}

	if (tempBox.yMax > 1) {
		tempBox.yMin -= tempBox.yMax - 1;
		tempBox.yMax = 1;
	}

	return {
		id: '',
		label: copyTarget.label,
		xMinNormalized: tempBox.xMin,
		xMaxNormalized: tempBox.xMax,
		yMinNormalized: tempBox.yMin,
		yMaxNormalized: tempBox.yMax
	};
};
