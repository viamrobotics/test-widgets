import { ResizeHandleLocation } from './bounding-box-types';

export const BOX_SIZE = 10;
export const INVISIBLE_BUFFER = 6;
export const WRAPPER_SIZE = BOX_SIZE + INVISIBLE_BUFFER;
export const OFFSET = -0.5 * WRAPPER_SIZE;
export const EDGE_WIDTH = 6;
export const EDGE_OFFSET = EDGE_WIDTH / -2;

const wrapperBaseProps = { height: WRAPPER_SIZE, width: WRAPPER_SIZE };

export const topLeft = {
	...wrapperBaseProps,
	positionLeft: OFFSET,
	positionTop: OFFSET,
	cursor: 'nwse-resize'
};

export const topRight = {
	...wrapperBaseProps,
	positionRight: OFFSET,
	positionTop: OFFSET,
	cursor: 'nesw-resize'
};

export const bottomLeft = {
	...wrapperBaseProps,
	positionLeft: OFFSET,
	positionBottom: OFFSET,
	cursor: 'nesw-resize'
};

export const bottomRight = {
	...wrapperBaseProps,
	positionRight: OFFSET,
	positionBottom: OFFSET,
	cursor: 'nwse-resize'
};

export const top = {
	height: `${EDGE_WIDTH}px`,
	width: '100%',
	positionTop: EDGE_OFFSET,
	cursor: 'ns-resize'
};

export const right = {
	height: '100%',
	width: `${EDGE_WIDTH}px`,
	positionRight: EDGE_OFFSET,
	cursor: 'ew-resize'
};

export const bottom = {
	height: `${EDGE_WIDTH}px`,
	width: '100%',
	positionBottom: EDGE_OFFSET,
	cursor: 'ns-resize'
};

export const left = {
	height: '100%',
	width: `${EDGE_WIDTH}px`,
	positionLeft: EDGE_OFFSET,
	cursor: 'ew-resize'
};

export const ResizeHandleClassMap: Record<ResizeHandleLocation, Record<string, number | string>> = {
	[ResizeHandleLocation.T]: top,
	[ResizeHandleLocation.R]: right,
	[ResizeHandleLocation.B]: bottom,
	[ResizeHandleLocation.L]: left,
	[ResizeHandleLocation.TL]: topLeft,
	[ResizeHandleLocation.TR]: topRight,
	[ResizeHandleLocation.BL]: bottomLeft,
	[ResizeHandleLocation.BR]: bottomRight
};
