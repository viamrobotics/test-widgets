import { isMediaFit, type MediaFit } from './media-fit'

export interface MediaFitOptions {
	/** The fits the select offers, such as `MEDIA_FITS` or `CANVAS_FITS`. */
	fits: readonly MediaFit[]
	/** Read while the person has picked nothing. Never written to the store. */
	defaultFit?: MediaFit
}

export interface MediaFitState {
	/** The person's pick, else `defaultFit`, else `'keep-ratio'`. A value outside `fits` is skipped. */
	current: MediaFit
	readonly fits: readonly MediaFit[]
}

const readStoredPick = (key: string): unknown => {
	const stored = localStorage.getItem(key)
	if (stored === null) return null
	try {
		return JSON.parse(stored)
	} catch {
		return null
	}
}

/**
 * The frame's persisted fit, one store per key, such as one per resource. Pass it to
 * `MediaFrame`'s `fit`. Call it during component init.
 */
export const createMediaFit = (getKey: () => string, options: MediaFitOptions): MediaFitState => {
	const key = $derived(getKey())
	// Not runed's PersistedState: it writes its initial value to an empty key, and the store must hold only a person's pick.
	let storedPick = $derived(readStoredPick(key))

	const isOffered = (fit: unknown): fit is MediaFit => isMediaFit(fit) && options.fits.includes(fit)

	return {
		get current() {
			if (isOffered(storedPick)) return storedPick
			if (isOffered(options.defaultFit)) return options.defaultFit
			return 'keep-ratio'
		},
		set current(next) {
			localStorage.setItem(key, JSON.stringify(next))
			storedPick = next
		},
		get fits() {
			return options.fits
		},
	}
}
