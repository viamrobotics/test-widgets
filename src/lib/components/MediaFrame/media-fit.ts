/** How the media fills its box: at its own ratio, or filling the frame's height. */
export type MediaFit = 'keep-ratio' | 'fit' | 'stretch' | 'crop'

/** Every fit, for a stream or an image. */
export const MEDIA_FITS: readonly MediaFit[] = ['keep-ratio', 'fit', 'stretch', 'crop']

/** A canvas or a map re-renders at its box size, so only these two mean anything there. */
export const CANVAS_FITS: readonly MediaFit[] = ['keep-ratio', 'fit']

export const MEDIA_FIT_LABELS: Record<MediaFit, string> = {
	'keep-ratio': 'Keep ratio',
	fit: 'Fit',
	stretch: 'Stretch',
	crop: 'Crop to fill',
}

const MEDIA_FIT_SET: ReadonlySet<unknown> = new Set(MEDIA_FITS)

export const isMediaFit = (value: unknown): value is MediaFit => MEDIA_FIT_SET.has(value)
