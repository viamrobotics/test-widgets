import type { GuestLayout } from '@viamrobotics/post-message-sdk/host'

const isSize = (value: number | undefined): value is number =>
	value !== undefined && Number.isFinite(value) && value >= 0

// A wider stated minWidth is capped, so every custom control still fits a 320 px pane.
const MAX_STATED_MIN_WIDTH = 320

/**
 * Bounds a guest's stated layout before the host acts on it. `minWidth` is capped at
 * `MAX_STATED_MIN_WIDTH`, and each ideal is raised to at least its bounded minimum. `minHeight` is
 * not capped. A field the guest left out stays out, and so does one that is not a finite size of
 * 0 or more.
 */
export const boundGuestLayout = (layout: GuestLayout): GuestLayout => {
	const bounded: GuestLayout = {}
	if (isSize(layout.minWidth)) {
		bounded.minWidth = Math.min(layout.minWidth, MAX_STATED_MIN_WIDTH)
	}
	if (isSize(layout.minHeight)) {
		bounded.minHeight = layout.minHeight
	}
	if (isSize(layout.idealWidth)) {
		bounded.idealWidth = Math.max(layout.idealWidth, bounded.minWidth ?? 0)
	}
	if (isSize(layout.idealHeight)) {
		bounded.idealHeight = Math.max(layout.idealHeight, bounded.minHeight ?? 0)
	}
	return bounded
}
