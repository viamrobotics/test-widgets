export interface BoundingCoords {
	xMinNormalized: number;
	xMaxNormalized: number;
	yMinNormalized: number;
	yMaxNormalized: number;
}
export interface BoundingBox extends BoundingCoords {
	id: string;
	label: string;
}

export enum BoxModifier {
	Scaled = 'scaled',
	Translated = 'translated',
	Resized = 'resized'
}

export enum ResizeHandleLocation {
	T = 'top',
	R = 'right',
	B = 'bottom',
	L = 'left',
	TL = 'top-left',
	TR = 'top-right',
	BR = 'bottom-right',
	BL = 'bottom-left'
}

export interface Coordinates {
	x: number;
	y: number;
}
